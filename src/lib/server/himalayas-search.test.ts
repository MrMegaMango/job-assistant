import { describe, expect, it } from 'vitest';
import { parseHimalayasJobs } from './himalayas-search';

const now = Date.parse('2026-09-27T20:00:00Z');
const sample = {
	title: 'Senior Engineer', companyName: 'New Example Company', companySlug: 'new-example',
	description: '<p>Build APIs with TypeScript</p>', locationRestrictions: ['United States'],
	guid: 'https://himalayas.app/companies/new-example/jobs/senior-engineer',
	pubDate: (now - 86_400_000) / 1000, expiryDate: (now + 86_400_000) / 1000,
	minSalary: 80, maxSalary: 100, currency: 'USD', salaryPeriod: 'hourly'
};

describe('Himalayas discovery normalization', () => {
	it('discovers an unlisted company and preserves timestamp units and hourly pay', () => {
		const [job] = parseHimalayasJobs({jobs: [sample]}, now);
		expect(job).toMatchObject({company: 'New Example Company', postedAt: '2026-09-26T20:00:00.000Z',
			description: 'Build APIs with TypeScript', listedSalary: 'USD 80–100 / hourly', employerUrl: null});
	});
	it('does not admit expired, future or unsafe listings', () => {
		expect(parseHimalayasJobs({jobs: [
			{...sample, expiryDate: (now - 1000) / 1000},
			{...sample, pubDate: (now + 1000) / 1000},
			{...sample, guid: 'https://himalayas.app.evil.test/companies/x/jobs/y'},
			{...sample, guid: 'https://user:password@himalayas.app/companies/x/jobs/y'},
			{...sample, guid: 'javascript:alert(1)'}, null
		]}, now)).toEqual([]);
	});
	it('keeps absent dates and pay unknown, and distinguishes an invalid payload from no jobs', () => {
		const [job] = parseHimalayasJobs({jobs: [{...sample, pubDate: null, expiryDate: null, minSalary: null}]}, now);
		expect(job.postedAt).toBeNull();
		expect(job.listedSalary).toBeNull();
		expect(() => parseHimalayasJobs({error: 'Unavailable'}, now)).toThrow();
		expect(parseHimalayasJobs({jobs: []}, now)).toEqual([]);
	});
});
