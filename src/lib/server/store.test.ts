import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NormalizedJob } from '$lib/types';

let testDir = '';

const baseJob: NormalizedJob = {
	externalId: 'base',
	company: 'Example Company',
	title: 'Senior Backend Engineer',
	location: 'Remote - United States',
	remote: true,
	description: 'Build reliable TypeScript and SQL services.',
	canonicalUrl: 'https://jobs.example.test/base',
	applyUrl: 'https://jobs.example.test/base/apply',
	postedAt: '2026-09-03T08:00:00.000Z',
	updatedAt: null,
	salary: null
};

beforeEach(() => {
	testDir = mkdtempSync(join(tmpdir(), 'job-assistant-store-test-'));
	process.env.JOB_ASSISTANT_DATA_DIR = testDir;
	vi.resetModules();
});

afterEach(async () => {
	const { closeDbForTests } = await import('./database');
	closeDbForTests();
	delete process.env.JOB_ASSISTANT_DATA_DIR;
	rmSync(testDir, { recursive: true, force: true });
});

describe('ranked job freshness', () => {
	it('shows only listings with a verified posting date under five days old', async () => {
		const store = await import('./store');
		const source = store.listSources()[0];
		store.upsertSourceJobs(source, [
			{
				...baseJob,
				externalId: 'fresh',
				postedAt: '2026-08-29T12:00:01.000Z'
			},
			{
				...baseJob,
				externalId: 'five-days-old',
				postedAt: '2026-08-29T12:00:00.000Z'
			},
			{
				...baseJob,
				externalId: 'unknown-age',
				postedAt: null,
				updatedAt: '2026-09-03T11:00:00.000Z'
			},
			{
				...baseJob,
				externalId: 'fresh-but-not-remote',
				remote: false,
				location: 'San Francisco, CA'
			}
		]);

		const jobs = store.listRankedJobs({
			minimumScore: 0,
			limit: 10,
			now: new Date('2026-09-03T12:00:00.000Z')
		});

		expect(jobs.map((job) => job.externalId)).toEqual(['fresh']);
		expect(jobs[0].listingAge).toMatchObject({ days: 4, label: 'Posted 4 days ago' });
		expect(store.hasRecentActiveRemoteJobs(new Date('2026-09-03T12:00:00.000Z'))).toBe(true);

		store.upsertSourceJobs(source, [
			{
				...baseJob,
				externalId: 'five-days-old',
				postedAt: '2026-08-29T12:00:00.000Z'
			}
		]);
		expect(store.hasRecentActiveRemoteJobs(new Date('2026-09-03T12:00:00.000Z'))).toBe(false);
	});
});
