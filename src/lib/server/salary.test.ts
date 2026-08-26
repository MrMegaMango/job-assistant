import { describe, expect, it } from 'vitest';
import { extractPostedSalary, softwareDeveloperBenchmark } from './salary';

describe('salary evidence', () => {
	it('extracts an employer annual salary range', () => {
		const result = extractPostedSalary(
			'The annual salary range for this role is $220,000 — $300,000 USD.',
			'https://example.com/job'
		);
		expect(result).toMatchObject({ min: 220_000, max: 300_000, sourceType: 'employer_posted' });
	});

	it('does not mistake fundraising for compensation', () => {
		const result = extractPostedSalary('We raised $355M at a $4.65B valuation.', 'https://example.com/job');
		expect(result).toBeNull();
	});

	it('labels BLS data as a government benchmark', () => {
		const result = softwareDeveloperBenchmark('Staff Backend Engineer');
		expect(result).toMatchObject({ sourceType: 'government_benchmark', min: 135_990 });
	});
});
