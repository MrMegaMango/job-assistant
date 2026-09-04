import { describe, expect, it } from 'vitest';
import { parseBoardInput } from './source-input';

describe('parseBoardInput', () => {
	it.each([
		['', 'https://job-boards.greenhouse.io/anthropic/jobs/123', 'greenhouse', 'anthropic'],
		['', 'https://boards.greenhouse.io/embed/job_board?for=stripe', 'greenhouse', 'stripe'],
		['', 'https://jobs.ashbyhq.com/openai/123', 'ashby', 'openai'],
		['', 'https://jobs.lever.co/spotify/123', 'lever', 'spotify']
	])('detects a provider and slug from %s %s', (provider, value, expectedProvider, expectedToken) => {
		expect(parseBoardInput(provider, value)).toEqual({
			provider: expectedProvider,
			boardToken: expectedToken
		});
	});

	it('accepts a slug with an explicit provider', () => {
		expect(parseBoardInput('ashby', 'company-name')).toEqual({
			provider: 'ashby',
			boardToken: 'company-name'
		});
	});

	it('rejects mismatched and unknown URLs', () => {
		expect(() => parseBoardInput('lever', 'https://jobs.ashbyhq.com/openai')).toThrow(/not lever/);
		expect(() => parseBoardInput('', 'https://example.com/jobs')).toThrow(/Greenhouse, Ashby, or Lever/);
	});
});
