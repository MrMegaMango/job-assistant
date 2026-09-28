import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobSource, NormalizedJob } from '$lib/types';

const mocks = vi.hoisted(() => ({
	fetchSource: vi.fn(),
	fetchJobsSnapshot: vi.fn(),
	isHostedDemo: vi.fn(),
	hasRecentActiveRemoteJobs: vi.fn(),
	listSources: vi.fn(),
	recordSourceFailure: vi.fn(),
	upsertSourceJobs: vi.fn()
}));

vi.mock('./connectors', () => ({ fetchSource: mocks.fetchSource }));
vi.mock('./jobs-snapshot', () => ({ fetchJobsSnapshot: mocks.fetchJobsSnapshot }));
vi.mock('./deployment', () => ({ isHostedDemo: mocks.isHostedDemo }));
vi.mock('./store', () => ({
	hasRecentActiveRemoteJobs: mocks.hasRecentActiveRemoteJobs,
	listSources: mocks.listSources,
	recordSourceFailure: mocks.recordSourceFailure,
	upsertSourceJobs: mocks.upsertSourceJobs
}));

const source: JobSource = {
	id: 1,
	provider: 'ashby',
	name: 'Example board',
	boardToken: 'example',
	enabled: true,
	policyUrl: 'https://example.test/policy',
	applyMode: 'link_only',
	lastSyncedAt: null,
	lastError: null
};

const SYNC_NOW = new Date('2026-09-21T12:00:00-07:00').getTime();
const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
const freshJob: NormalizedJob = {
	externalId: 'fresh',
	company: 'Example',
	title: 'Software Engineer',
	location: 'Remote',
	remote: true,
	description: 'Build reliable software.',
	canonicalUrl: 'https://example.test/jobs/fresh',
	applyUrl: 'https://example.test/jobs/fresh/apply',
	postedAt: new Date(SYNC_NOW).toISOString(),
	updatedAt: null,
	salary: null
};

function mixedJobs(): NormalizedJob[] {
	return [
		freshJob,
		{ ...freshJob, externalId: 'just-inside', postedAt: new Date(SYNC_NOW - FIVE_DAYS + 1).toISOString() },
		{ ...freshJob, externalId: 'boundary', postedAt: new Date(SYNC_NOW - FIVE_DAYS).toISOString() },
		{ ...freshJob, externalId: 'older', postedAt: new Date(SYNC_NOW - FIVE_DAYS - 1).toISOString() },
		{ ...freshJob, externalId: 'future', postedAt: new Date(SYNC_NOW + 1).toISOString() },
		{ ...freshJob, externalId: 'unknown', postedAt: null },
		{ ...freshJob, externalId: 'invalid', postedAt: 'not-a-date' },
		{ ...freshJob, externalId: 'onsite', remote: false, location: 'San Francisco' }
	];
}

beforeEach(() => {
	vi.resetModules();
	vi.resetAllMocks();
	vi.spyOn(Date, 'now').mockReturnValue(SYNC_NOW);
	mocks.isHostedDemo.mockReturnValue(true);
	mocks.hasRecentActiveRemoteJobs.mockReturnValue(false);
	mocks.listSources.mockReturnValue([source]);
	mocks.upsertSourceJobs.mockReturnValue(0);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('source sync', () => {
	it('coalesces overlapping sync requests', async () => {
		let finishFetch: ((jobs: []) => void) | undefined;
		mocks.fetchSource.mockImplementation(
			() =>
				new Promise<[]>((resolve) => {
					finishFetch = resolve;
				})
		);
		const { syncEnabledSources } = await import('./sync');

		const first = syncEnabledSources();
		const second = syncEnabledSources();
		expect(mocks.fetchSource).toHaveBeenCalledTimes(1);
		finishFetch?.([]);

		const [firstResult, secondResult] = await Promise.all([first, second]);
		expect(firstResult).toEqual([{ source: source.name, count: 0, error: null }]);
		expect(secondResult).toEqual(firstResult);
	});

	it('allows another sync immediately after the previous one finishes', async () => {
		mocks.fetchSource.mockResolvedValue([]);
		const { syncEnabledSources } = await import('./sync');

		const firstResult = await syncEnabledSources();
		const secondResult = await syncEnabledSources();

		expect(mocks.fetchSource).toHaveBeenCalledTimes(2);
		expect([...firstResult, ...secondResult].every((result) => result.error === null)).toBe(true);
	});

	it('keeps the queue moving around a slow feed without exceeding twelve active fetches', async () => {
		const sources = Array.from({ length: 25 }, (_, index) => ({
			...source, id: index + 1, name: `Board ${index + 1}`, boardToken: `board-${index + 1}`
		}));
		mocks.listSources.mockReturnValue([...sources, { ...source, id: 26, enabled: false }]);
		const pending = new Map<number, () => void>();
		let active = 0;
		let peakActive = 0;
		mocks.fetchSource.mockImplementation((board: JobSource) => {
			active += 1;
			peakActive = Math.max(peakActive, active);
			return new Promise<NormalizedJob[]>((resolve) => {
				pending.set(board.id, () => {
					pending.delete(board.id);
					active -= 1;
					resolve([]);
				});
			});
		});
		const { syncEnabledSources } = await import('./sync');
		const sync = syncEnabledSources();
		expect(mocks.fetchSource).toHaveBeenCalledTimes(12);
		expect(active).toBe(12);

		// Leave the first feed unresolved while every other worker drains the queue.
		while (pending.size > 1) {
			const ready = [...pending.entries()].find(([id]) => id !== 1);
			expect(ready).toBeDefined();
			ready?.[1]();
			await Promise.resolve();
			await Promise.resolve();
		}
		expect(mocks.fetchSource).toHaveBeenCalledTimes(25);
		expect(peakActive).toBe(12);
		expect(active).toBe(1);
		pending.get(1)?.();
		const results = await sync;
		expect(active).toBe(0);
		expect(results.map((result) => result.source)).toEqual(sources.map((board) => board.name));
	});

	it('persists only eligible remote jobs on hosted sync, including the exact age boundary', async () => {
		const jobs = mixedJobs();
		mocks.fetchSource.mockResolvedValue(jobs);
		mocks.upsertSourceJobs.mockImplementation((_source: JobSource, kept: NormalizedJob[]) => kept.length);
		const { syncEnabledSources } = await import('./sync');

		const results = await syncEnabledSources();

		expect(mocks.upsertSourceJobs).toHaveBeenCalledWith(source, jobs.slice(0, 2));
		expect(results).toEqual([{ source: source.name, count: 2, error: null }]);
	});

	it('preserves all fetched jobs during local sync', async () => {
		const jobs = mixedJobs();
		mocks.isHostedDemo.mockReturnValue(false);
		mocks.fetchSource.mockResolvedValue(jobs);
		const { syncEnabledSources } = await import('./sync');

		await syncEnabledSources();

		expect(mocks.upsertSourceJobs).toHaveBeenCalledWith(source, jobs);
	});

	it('isolates a failed feed and still saves successful and empty feeds', async () => {
		const good = { ...source, id: 2, name: 'Good board' };
		const empty = { ...source, id: 3, name: 'Empty board' };
		mocks.listSources.mockReturnValue([source, good, empty]);
		mocks.fetchSource.mockImplementation(async (board: JobSource) => {
			if (board.id === source.id) throw new Error('Source unavailable');
			return board.id === good.id ? [freshJob] : [];
		});
		mocks.upsertSourceJobs.mockImplementation((_source: JobSource, jobs: NormalizedJob[]) => jobs.length);
		const { syncEnabledSources } = await import('./sync');

		const results = await syncEnabledSources();

		expect(mocks.recordSourceFailure).toHaveBeenCalledWith(source.id, 'Source unavailable');
		expect(mocks.upsertSourceJobs).toHaveBeenCalledTimes(2);
		expect(mocks.upsertSourceJobs).toHaveBeenCalledWith(good, [freshJob]);
		expect(mocks.upsertSourceJobs).toHaveBeenCalledWith(empty, []);
		expect(results).toEqual([
		{ source: source.name, count: 0, error: 'Source unavailable' },
		{ source: good.name, count: 1, error: null },
		{ source: empty.name, count: 0, error: null }
		]);
	});
});

describe('hosted cold start', () => {
	function snapshot(entry: { error?: string | null; jobs?: NormalizedJob[] } = {}) {
		return {
			version: 1,
			generatedAt: new Date(SYNC_NOW).toISOString(),
			sources: [
				{
					provider: source.provider,
					boardToken: source.boardToken,
					name: source.name,
					error: entry.error ?? null,
					jobs: entry.jobs ?? mixedJobs()
				}
			]
		};
	}

	it('loads the published snapshot instead of fetching every source', async () => {
		mocks.fetchJobsSnapshot.mockResolvedValue(snapshot());
		const { ensureHostedJobs } = await import('./sync');

		await ensureHostedJobs();

		expect(mocks.fetchSource).not.toHaveBeenCalled();
		expect(mocks.upsertSourceJobs).toHaveBeenCalledWith(source, mixedJobs().slice(0, 2));
	});

	it('records a source the nightly sync could not reach without fetching it from the preview', async () => {
		mocks.fetchJobsSnapshot.mockResolvedValue(snapshot({ error: 'Source returned HTTP 503.', jobs: [] }));
		const { ensureHostedJobs } = await import('./sync');

		await ensureHostedJobs();

		expect(mocks.recordSourceFailure).toHaveBeenCalledWith(source.id, 'Source returned HTTP 503.');
		expect(mocks.upsertSourceJobs).not.toHaveBeenCalled();
		expect(mocks.fetchSource).not.toHaveBeenCalled();
	});

	it('syncs sources itself only when the snapshot is unavailable', async () => {
		mocks.fetchJobsSnapshot.mockRejectedValue(new Error('Source returned HTTP 404.'));
		mocks.fetchSource.mockResolvedValue([freshJob]);
		const { ensureHostedJobs } = await import('./sync');

		await ensureHostedJobs();

		expect(mocks.fetchSource).toHaveBeenCalledWith(source);
		expect(mocks.upsertSourceJobs).toHaveBeenCalledWith(source, [freshJob]);
	});

	it('shares one snapshot load across concurrent cold requests', async () => {
		mocks.fetchJobsSnapshot.mockResolvedValue(snapshot());
		const { ensureHostedJobs } = await import('./sync');

		await Promise.all([ensureHostedJobs(), ensureHostedJobs()]);

		expect(mocks.fetchJobsSnapshot).toHaveBeenCalledTimes(1);
	});

	it('does nothing locally or when recent jobs are already loaded', async () => {
		const { ensureHostedJobs } = await import('./sync');
		mocks.hasRecentActiveRemoteJobs.mockReturnValue(true);
		await ensureHostedJobs();
		mocks.hasRecentActiveRemoteJobs.mockReturnValue(false);
		mocks.isHostedDemo.mockReturnValue(false);
		await ensureHostedJobs();

		expect(mocks.fetchJobsSnapshot).not.toHaveBeenCalled();
		expect(mocks.fetchSource).not.toHaveBeenCalled();
	});
});
