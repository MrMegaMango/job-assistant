import { describe, expect, it } from 'vitest';
import type { JobSource } from '$lib/types';
import { COMPENSATION_COMPANIES, listCompensationCompanies } from './levels-companies';
import { DEFAULT_SOURCES } from './source-catalog';

const sources: JobSource[] = DEFAULT_SOURCES.map((source, index) => ({
	...source, id: index + 1, enabled: true, applyMode: 'link_only', lastSyncedAt: null, lastError: null
}));

describe('Levels.fyi company coverage', () => {
	it('only qualifies attributed annual USD evidence at or above the requested threshold', () => {
		const slugs = COMPENSATION_COMPANIES.map((company) => company.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		const sourceKeys = new Set(DEFAULT_SOURCES.map((source) => `${source.provider}:${source.boardToken}`));
		for (const company of COMPENSATION_COMPANIES) {
			expect(Number.isFinite(company.reportedAnnualUsd)).toBe(true);
			expect(company.reportedAnnualUsd).toBeGreaterThanOrEqual(300_000);
			expect(company.role.trim()).not.toBe('');
			const url = new URL(company.levelsUrl);
			expect(url.origin).toBe('https://www.levels.fyi');
			expect(url.pathname).toMatch(new RegExp(`^/companies/${company.slug}/salaries(?:/|$)`));
			if (company.sourceKey) expect(sourceKeys.has(company.sourceKey)).toBe(true);
		}
	});

	it('keeps salary evidence separate from feed availability and preserves paused/error status', () => {
		const paused = sources.map((source) => ({ ...source, enabled: false, lastError: 'Unavailable' }));
		const directory = listCompensationCompanies(paused);
		expect(directory.companies).toHaveLength(COMPENSATION_COMPANIES.length);
		const connected = directory.companies.find((company) => company.source !== null);
		expect(connected?.source?.enabled).toBe(false);
		expect(connected?.source?.lastError).toBe('Unavailable');
		const withoutSources = listCompensationCompanies([]);
		expect(withoutSources.companies.every((company) => company.source === null)).toBe(true);
		expect(withoutSources.companies.find((company) => company.slug === 'netflix')?.jobsUrl)
			.toBe('https://www.levels.fyi/companies/netflix/jobs');
	});

	it('does not join different employers that share a name', () => {
		const unrelated = { ...sources[0], name: 'Flex', provider: 'greenhouse' as const, boardToken: 'flex' };
		const flex = listCompensationCompanies([unrelated]).companies.find((company) => company.slug === 'flex');
		expect(flex?.source).toBeNull();
	});

	it('does not claim that unverified companies have been researched', () => {
		const directory = listCompensationCompanies(sources);
		expect(directory.checkedCompanies).toBeGreaterThanOrEqual(directory.companies.length);
		expect(directory.checkedCompanies).toBeLessThan(directory.discoveredCompanies);
		expect(directory.failedCompanies).toBeGreaterThan(0);
		expect(directory.checkedCompanies + directory.failedCompanies).toBeLessThanOrEqual(directory.discoveredCompanies);
	});
});
