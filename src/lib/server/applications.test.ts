import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NormalizedJob } from '$lib/types';

let testDir = '';

const fixtureJob: NormalizedJob = {
	externalId: 'fixture-1',
	company: 'Example Company',
	title: 'Senior Backend Engineer',
	location: 'Remote - United States',
	remote: true,
	description: 'Build reliable web services with TypeScript, SQL, and distributed systems.',
	canonicalUrl: 'https://jobs.example.test/fixture-1',
	applyUrl: 'https://jobs.example.test/fixture-1/apply',
	postedAt: '2026-08-25T00:00:00.000Z',
	updatedAt: null,
	salary: {
		min: 140_000,
		max: 180_000,
		currency: 'USD',
		period: 'year',
		sourceType: 'employer_posted',
		sourceUrl: 'https://jobs.example.test/fixture-1'
	}
};

beforeEach(() => {
	testDir = mkdtempSync(join(tmpdir(), 'job-assistant-test-'));
	process.env.JOB_ASSISTANT_DATA_DIR = testDir;
	vi.resetModules();
});

afterEach(async () => {
	const { closeDbForTests } = await import('./database');
	closeDbForTests();
	delete process.env.JOB_ASSISTANT_DATA_DIR;
	rmSync(testDir, { recursive: true, force: true });
});

async function seedJob(): Promise<number> {
	const store = await import('./store');
	const source = store.listSources()[0];
	store.upsertSourceJobs(source, [fixtureJob]);
	const job = store.listRankedJobs({ minimumScore: 0, limit: 1 })[0];
	if (!job) throw new Error('Fixture job was not created.');
	return job.id;
}

describe('application safety state machine', () => {
	it('blocks approval when identity or resume input is missing', async () => {
		const jobId = await seedJob();
		const applications = await import('./applications');
		applications.shortlist(jobId);
		const prepared = applications.prepareApplication(jobId);
		expect(prepared.state).toBe('NEEDS_INPUT');
		expect(() => applications.approveAndConsumeForOpen(jobId)).toThrow(/Resolve the application checklist/);
	});

	it('requires preparation before opening and user confirmation before submitted state', async () => {
		const jobId = await seedJob();
		const resumePath = join(testDir, 'resume.pdf');
		writeFileSync(resumePath, 'synthetic test resume');
		const store = await import('./store');
		const current = store.getProfile();
		store.saveProfile({
			name: 'Test Candidate',
			email: 'candidate@example.test',
			phone: '+1 555 0100',
			resumePath,
			targetTitles: current.targetTitles,
			skills: current.skills,
			focusAreas: current.focusAreas,
			preferredLocations: current.preferredLocations,
			remotePreference: current.remotePreference,
			minBaseSalary: current.minBaseSalary,
			excludedKeywords: current.excludedKeywords
		});

		const applications = await import('./applications');
		expect(() => applications.approveAndConsumeForOpen(jobId)).toThrow(/Prepare the application first/);
		const prepared = applications.prepareApplication(jobId);
		expect(prepared.state).toBe('READY_FOR_REVIEW');
		expect(applications.approveAndConsumeForOpen(jobId)).toBe(fixtureJob.applyUrl);
		expect(store.getApplicationForJob(jobId)?.state).toBe('OPENED');
		applications.confirmSubmitted(jobId, 'confirmation-123');
		expect(store.getApplicationForJob(jobId)).toMatchObject({
			state: 'SUBMITTED',
			confirmationId: 'confirmation-123'
		});
	});
});
