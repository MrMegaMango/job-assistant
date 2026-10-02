import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CandidateProfile } from '$lib/types';
import { discoverCompanies, discoveryDefaults } from './live-discovery';

const mocks = vi.hoisted(() => ({ startup: vi.fn(), himalayas: vi.fn(), funding: vi.fn(), company: vi.fn() }));
vi.mock('./startup-search', () => ({ searchStartupJobs: mocks.startup, findStartupCompanyJobs: mocks.company }));
vi.mock('./himalayas-search', () => ({ searchHimalayas: mocks.himalayas }));
vi.mock('./funding-discovery', async (original) => ({...await original<typeof import('./funding-discovery')>(), discoverFunding: mocks.funding}));

const profile: CandidateProfile = {
	id: 1, name: 'Private Example', email: 'private@example.test', phone: 'private-phone', resumePath: '/private/resume.pdf',
	targetTitles: ['Backend Engineer'], skills: ['TypeScript'], focusAreas: ['backend infrastructure'], preferredLocations: ['United States'],
	remotePreference: 'remote', minBaseSalary: null, excludedKeywords: [], updatedAt: '2026-09-01T00:00:00Z'
};
const job = {
	company: 'New Example Labs', companySlug: 'new-example-labs', companyWebsite: null, title: 'Backend Engineer',
	description: 'Build backend infrastructure and APIs using TypeScript.', location: 'United States', remote: true,
	listingUrl: 'https://startup.jobs/backend-engineer-new-example-123', employerUrl: null,
	postedAt: '2026-09-26T12:00:00Z', expiresAt: null, listedSalary: null
};
const lead = {
	id: 'https://techcrunch.com/example/', company: job.company, title: 'New Example Labs raises $20M',
	url: 'https://techcrunch.com/example/', publisher: 'TechCrunch', publishedAt: '2026-09-25T12:00:00Z',
	knownCompany: false, jobCount: 0, hiringStatus: 'not_checked'
};
beforeEach(() => {
	vi.clearAllMocks();
	mocks.startup.mockResolvedValue({jobs: [job], total: 1});
	mocks.himalayas.mockResolvedValue([]);
	mocks.funding.mockResolvedValue({leads: [], warnings: []});
	mocks.company.mockResolvedValue({jobs: [], total: 0});
});

describe('hybrid company discovery', () => {
	it('admits employers outside the list and only sends editable search fields to providers', async () => {
		const result = await discoverCompanies({...discoveryDefaults(profile), fundingDays: 90, profile});
		expect(result.jobs[0]).toMatchObject({company: job.company, knownCompany: false});
		expect(mocks.startup).toHaveBeenCalledWith('Backend Engineer', 'United States');
		expect(mocks.himalayas).toHaveBeenCalledWith('Backend Engineer', 'United States');
		expect(JSON.stringify([...mocks.startup.mock.calls, ...mocks.himalayas.mock.calls])).not.toContain('private');
	});
	it('uses funding to discover employers while keeping funding separate from match scoring', async () => {
		const baseline = await discoverCompanies({query: 'backend', country: 'United States', fundingDays: 90, profile});
		mocks.startup.mockResolvedValue({jobs: [], total: 0});
		mocks.funding.mockResolvedValue({leads: [{...lead}], warnings: []});
		mocks.company.mockResolvedValue({jobs: [job], total: 1});
		const result = await discoverCompanies({query: 'backend', country: 'United States', fundingDays: 90, profile});
		expect(mocks.company).toHaveBeenCalledWith('New Example Labs');
		expect(result.funding[0]).toMatchObject({hiringStatus: 'indexed_openings', jobCount: 1});
		expect(result.jobs[0].match.score).toBe(baseline.jobs[0].match.score);
		expect(result.jobs[0].employerUrl).toBeNull();
	});
	it('does not confuse unavailable coverage with no openings, and preserves other results', async () => {
		mocks.funding.mockResolvedValue({leads: [{...lead, company: 'Different Labs'}], warnings: []});
		mocks.company.mockRejectedValue(new Error('429'));
		mocks.himalayas.mockRejectedValue(new Error('Unavailable'));
		const result = await discoverCompanies({query: 'backend', country: '', fundingDays: 30, profile});
		expect(result.jobs).toHaveLength(1);
		expect(result.funding[0].hiringStatus).toBe('unavailable');
		expect(result.warnings).toHaveLength(2);
	});
	it('deduplicates the same role and rejects mismatched company lookup results', async () => {
		mocks.startup.mockResolvedValue({jobs: [job, {...job}], total: 2});
		mocks.funding.mockResolvedValue({leads: [{...lead, company: 'Other Labs'}], warnings: []});
		mocks.company.mockResolvedValue({jobs: [job], total: 1});
		const result = await discoverCompanies({query: 'backend', country: '', fundingDays: 90, profile});
		expect(result.jobs).toHaveLength(1);
		expect(result.funding[0].hiringStatus).toBe('not_found');
	});
	it('keeps all-location hiring evidence separate from remote roles in the selected country', async () => {
		mocks.startup.mockResolvedValue({jobs: [], total: 0});
		mocks.funding.mockResolvedValue({leads: [{...lead}], warnings: []});
		mocks.company.mockResolvedValue({jobs: [
			{...job, location: 'London, United Kingdom', listingUrl: job.listingUrl + '-uk'},
			{...job, remote: false, listingUrl: job.listingUrl + '-onsite'},
			{...job, location: 'San Francisco, California, US'}
		], total: 3});
		const result = await discoverCompanies({query: 'backend', country: 'United States', fundingDays: 90, profile});
		expect(result.jobs).toHaveLength(1);
		expect(result.jobs[0].location).toBe('San Francisco, California, US');
		expect(result.funding[0].jobCount).toBe(3);
	});
	it('checks the selected report company even when it falls outside the first two reports', async () => {
		mocks.funding.mockResolvedValue({leads: ['First Labs', 'Second Labs', 'Selected Labs'].map((company, i) => ({...lead, company, id: String(i)})), warnings: []});
		await discoverCompanies({query: 'Selected Labs', country: '', fundingDays: 90, profile});
		expect(mocks.company).toHaveBeenCalledWith('Selected Labs');
		expect(mocks.company).toHaveBeenCalledTimes(2);
	});
	it('does not attach a funding report to known same-name company ambiguities', async () => {
		mocks.funding.mockResolvedValue({leads: [{...lead}], warnings: []});
		const error = new Error('Multiple companies'); error.name = 'AmbiguousCompanyError';
		mocks.company.mockRejectedValue(error);
		const result = await discoverCompanies({query: 'backend', country: '', fundingDays: 90, profile});
		expect(result.funding[0].hiringStatus).toBe('ambiguous');
		expect(result.jobs[0].funding).toEqual([]);
	});
});
