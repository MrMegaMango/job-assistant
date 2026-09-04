import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobSource } from '$lib/types';

const mocks = vi.hoisted(() => ({
	fetchSource: vi.fn(),
	isHostedDemo: vi.fn(),
	hasRecentActiveRemoteJobs: vi.fn(),
	listSources: vi.fn(),
	recordSourceFailure: vi.fn(),
	upsertSourceJobs: vi.fn()
}));

vi.mock('./connectors', () => ({ fetchSource: mocks.fetchSource }));
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

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	mocks.isHostedDemo.mockReturnValue(true);
	mocks.hasRecentActiveRemoteJobs.mockReturnValue(false);
	mocks.listSources.mockReturnValue([source]);
	mocks.upsertSourceJobs.mockReturnValue(0);
});

describe('hosted source sync', () => {
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
});
