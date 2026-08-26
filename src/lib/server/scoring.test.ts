import { describe, expect, it } from 'vitest';
import type { CandidateProfile, NormalizedJob } from '$lib/types';
import { scoreJob } from './scoring';

const profile: CandidateProfile = {
	id: 1,
	name: '',
	email: '',
	phone: '',
	resumePath: '',
	targetTitles: ['Senior Software Engineer', 'Backend Engineer'],
	skills: ['TypeScript', 'SQL', 'Docker', 'REST'],
	preferredLocations: ['Remote'],
	remotePreference: 'any',
	minBaseSalary: 120_000,
	excludedKeywords: ['gambling'],
	updatedAt: '2026-08-25T00:00:00.000Z'
};

const job: NormalizedJob = {
	externalId: '1',
	company: 'Example Company',
	title: 'Senior Backend Engineer',
	location: 'Remote - United States',
	remote: true,
	description: 'Build TypeScript services backed by SQL and Docker, using well-designed REST APIs.',
	canonicalUrl: 'https://example.com/jobs/1',
	applyUrl: 'https://example.com/jobs/1/apply',
	postedAt: '2026-08-24T00:00:00.000Z',
	updatedAt: null,
	salary: {
		min: 140_000,
		max: 180_000,
		currency: 'USD',
		period: 'year',
		sourceType: 'employer_posted',
		sourceUrl: 'https://example.com/jobs/1'
	}
};

describe('explainable matching', () => {
	it('scores a strong evidence-backed match highly', () => {
		const result = scoreJob(profile, job);
		expect(result.score).toBeGreaterThanOrEqual(70);
		expect(result.matchedSkills).toContain('Docker');
		expect(result.hardRejected).toBe(false);
	});

	it('keeps hard filters separate from soft matching', () => {
		const result = scoreJob(profile, {
			...job,
			description: `${job.description} The product is an online gambling platform.`
		});
		expect(result.score).toBe(0);
		expect(result.hardRejected).toBe(true);
		expect(result.gaps.join(' ')).toMatch(/Excluded phrase/);
	});
});
