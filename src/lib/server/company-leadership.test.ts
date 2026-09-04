import { describe, expect, it } from 'vitest';
import { COMPANY_LEADERSHIP, getCompanyLeadership } from './company-leadership';
import { DEFAULT_SOURCES } from './source-catalog';

describe('company leadership research', () => {
	it('covers every default employer company exactly once', () => {
		const catalogCompanies = DEFAULT_SOURCES.filter((source) => source.provider !== 'wwr')
			.map((source) => source.name)
			.sort();
		const researchedCompanies = COMPANY_LEADERSHIP.map((entry) => entry.company).sort();

		expect(new Set(researchedCompanies).size).toBe(researchedCompanies.length);
		expect(researchedCompanies).toEqual(catalogCompanies);
	});

	it('records an executive role, a surname result, and a CTO result for every company', () => {
		for (const entry of COMPANY_LEADERSHIP) {
			expect(entry.people.some((leader) => leader.role.toLowerCase().includes('ceo') || leader.role.includes('principal executive'))).toBe(true);
			expect(entry.people.every((leader) => leader.surnameOrigin.length > 0)).toBe(true);
			expect(
				entry.people.some((leader) => /cto|technology officer/i.test(leader.role)) ||
					Boolean(entry.technologyRoleNote)
			).toBe(true);
		}
	});

	it('uses HTTPS evidence links and does not create demographic labels', () => {
		for (const entry of COMPANY_LEADERSHIP) {
			expect(entry.companySourceUrl).toMatch(/^https:\/\//);
			for (const leader of entry.people) {
				if (leader.leadershipUrl) expect(leader.leadershipUrl).toMatch(/^https:\/\//);
				if (leader.surnameReferenceUrl) expect(leader.surnameReferenceUrl).toMatch(/^https:\/\//);
				expect(leader.surnameOrigin).not.toMatch(/\brace\b|\bethnicity\b/i);
			}
		}
	});

	it('returns null for a user-added company without curated research', () => {
		expect(getCompanyLeadership('Example Company')).toBeNull();
	});
});
