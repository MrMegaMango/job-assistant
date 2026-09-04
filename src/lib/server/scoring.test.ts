import { describe, expect, it } from 'vitest';
import type { CandidateProfile, NormalizedJob } from '$lib/types';
import { DEMO_MATCH_PROFILES } from './profile';
import { scoreJob } from './scoring';

const profile: CandidateProfile = {
	id: 1,
	name: '',
	email: '',
	phone: '',
	resumePath: '',
	targetTitles: ['Staff AI Infrastructure Engineer', 'Staff Backend Engineer', 'Member of Technical Staff'],
	skills: ['Go', 'GCP', 'Kubernetes', 'RAG', 'LLM evaluation', 'LLM inference'],
	focusAreas: ['AI infrastructure', 'LLM inference', 'model serving', 'RAG and retrieval', 'evaluation systems'],
	preferredLocations: ['San Diego', 'California', 'United States'],
	remotePreference: 'any',
	minBaseSalary: 180_000,
	excludedKeywords: ['gambling'],
	updatedAt: '2026-08-25T00:00:00.000Z'
};

const job: NormalizedJob = {
	externalId: '1',
	company: 'Example Company',
	title: 'Staff AI Infrastructure Engineer',
	location: 'Remote - United States',
	remote: true,
	description:
		'Build Golang services on Google Cloud and k8s for retrieval-augmented generation, an eval harness, and model serving.',
	canonicalUrl: 'https://example.com/jobs/1',
	applyUrl: 'https://example.com/jobs/1/apply',
	postedAt: '2026-08-24T00:00:00.000Z',
	updatedAt: null,
	salary: {
		min: 220_000,
		max: 300_000,
		currency: 'USD',
		period: 'year',
		sourceType: 'employer_posted',
		sourceUrl: 'https://example.com/jobs/1'
	}
};

describe('explainable matching', () => {
	it('scores a strong tailored match highly and resolves aliases once', () => {
		const result = scoreJob(profile, job);
		expect(result.score).toBeGreaterThanOrEqual(80);
		expect(result.matchedSkills).toEqual([
			'Go',
			'GCP',
			'Kubernetes',
			'RAG',
			'LLM evaluation',
			'LLM inference'
		]);
		expect(result.matchedFocusAreas).toContain('model serving');
		expect(result.hardRejected).toBe(false);
	});

	it('uses token boundaries for short skill and focus phrases', () => {
		const result = scoreJob(profile, {
			...job,
			title: 'Software Engineer',
			description: 'Maintain Google storage algorithms for an ongoing paid product.'
		});
		expect(result.matchedSkills).toEqual([]);
		expect(result.matchedFocusAreas).toEqual([]);
	});

	it('ranks an inference-focused MTS role above an unrelated MTS role', () => {
		const inference = scoreJob(profile, {
			...job,
			title: 'Member of Technical Staff, Inference Infrastructure',
			description: 'Build model serving and inference infrastructure on Kubernetes.'
		});
		const offensiveSecurity = scoreJob(profile, {
			...job,
			title: 'Member of Technical Staff, Offensive Security',
			description: 'Run penetration tests, threat emulation, and security reviews.'
		});
		expect(inference.score).toBeGreaterThan(offensiveSecurity.score);
	});

	it('orders staff, senior, and early-career seniority explicitly', () => {
		const staff = scoreJob(profile, job);
		const staffPlus = scoreJob(profile, { ...job, title: 'Staff+ AI Infrastructure Engineer' });
		const senior = scoreJob(profile, { ...job, title: 'Senior AI Infrastructure Engineer' });
		const intern = scoreJob(profile, { ...job, title: 'AI Infrastructure Engineer Intern' });
		expect(staff.components.seniority).toBe(15);
		expect(staffPlus.components.seniority).toBe(15);
		expect(senior.components.seniority).toBe(10);
		expect(intern.components.seniority).toBe(0);
		expect(intern.gaps.join(' ')).toMatch(/interns|junior/);
	});

	it('compares seniority with the configured target level', () => {
		const juniorProfile = { ...profile, targetTitles: ['Junior Backend Engineer'] };
		const junior = scoreJob(juniorProfile, { ...job, title: 'Junior Backend Engineer' });
		const staff = scoreJob(juniorProfile, { ...job, title: 'Staff Backend Engineer' });
		expect(junior.components.seniority).toBe(15);
		expect(staff.components.seniority).toBe(8);
		expect(junior.gaps.join(' ')).not.toMatch(/interns|junior/);
	});

	it('penalizes region-restricted remote roles outside preferred locations', () => {
		const usRemote = scoreJob(profile, { ...job, location: 'Remote - US' });
		const californiaRemote = scoreJob(profile, { ...job, location: 'San Francisco, CA' });
		const europeRemote = scoreJob(profile, { ...job, location: 'Remote - Europe' });
		expect(usRemote.components.location).toBe(8);
		expect(californiaRemote.components.location).toBe(8);
		expect(europeRemote.components.location).toBe(3);
		expect(europeRemote.unknowns.join(' ')).toMatch(/region-limited/);
	});

	it('hard-rejects non-remote jobs when remote work is required', () => {
		const result = scoreJob(
			{ ...profile, remotePreference: 'remote' },
			{ ...job, location: 'San Francisco, CA', remote: false }
		);
		expect(result.hardRejected).toBe(true);
		expect(result.score).toBe(0);
		expect(result.gaps.join(' ')).toMatch(/not remote/);
	});

	it('prefers remote work without rejecting otherwise strong onsite roles', () => {
		const remoteProfile = { ...profile, remotePreference: 'remote_preferred' as const };
		const remote = scoreJob(remoteProfile, job);
		const preferredOnsite = scoreJob(remoteProfile, {
			...job,
			location: 'San Diego, California',
			remote: false
		});
		const otherOnsite = scoreJob(remoteProfile, {
			...job,
			location: 'New York, New York',
			remote: false
		});

		expect(remote.components.location).toBe(10);
		expect(preferredOnsite.components.location).toBe(7);
		expect(otherOnsite.components.location).toBe(2);
		expect(preferredOnsite.hardRejected).toBe(false);
		expect(preferredOnsite.gaps.join(' ')).toMatch(/prefers remote work/);
	});

	it('does not hard-reject a non-USD range against a USD salary floor', () => {
		const result = scoreJob(profile, {
			...job,
			salary: { ...job.salary!, min: 100_000, max: 120_000, currency: 'EUR' }
		});
		expect(result.hardRejected).toBe(false);
		expect(result.unknowns.join(' ')).toMatch(/not an annual USD range/);
	});

	it('keeps explicit hard filters separate from soft matching', () => {
		const result = scoreJob(profile, {
			...job,
			description: `${job.description} The product is an online gambling platform.`
		});
		expect(result.score).toBe(0);
		expect(result.hardRejected).toBe(true);
		expect(result.gaps.join(' ')).toMatch(/Excluded phrase/);
	});

	it('rewards async signals and rejects visible workload conflicts for the OE screen', () => {
		const oeProfile: CandidateProfile = {
			...profile,
			...DEMO_MATCH_PROFILES['remote-async-ic'].criteria
		};
		const compatible = scoreJob(oeProfile, {
			...job,
			title: 'Senior Backend Engineer',
			description:
				'Async-first remote team building internal tools and backend services with design docs and technical documentation.'
		});
		const onCall = scoreJob(oeProfile, {
			...job,
			title: 'Senior Backend Engineer',
			description: `${compatible.strengths.join(' ')} Participate in the on-call rotation.`
		});

		expect(compatible.hardRejected).toBe(false);
		expect(compatible.matchedFocusAreas).toEqual(
			expect.arrayContaining([
				'asynchronous collaboration',
				'backend services',
				'internal tools',
				'documentation-driven engineering'
			])
		);
		expect(onCall.hardRejected).toBe(true);
		expect(onCall.gaps.join(' ')).toMatch(/on-call/);
	});
});
