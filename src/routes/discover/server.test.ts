import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CandidateProfile } from '$lib/types';
import { actions, load } from './+page.server';

const mocks = vi.hoisted(() => ({
	getProfile: vi.fn(),
	discoverCompanies: vi.fn(),
	discoveryDefaults: vi.fn()
}));

vi.mock('$lib/server/store', () => ({ getProfile: mocks.getProfile }));
vi.mock('$lib/server/live-discovery', () => ({
	discoverCompanies: mocks.discoverCompanies,
	discoveryDefaults: mocks.discoveryDefaults
}));

const profile: CandidateProfile = {
	id: 1,
	name: 'Private fixture',
	email: 'fixture@example.test',
	phone: '555-0100',
	resumePath: '/private/fixture.pdf',
	targetTitles: ['Platform Engineer'],
	skills: ['Python'],
	focusAreas: ['Infrastructure'],
	preferredLocations: ['United States'],
	remotePreference: 'remote_preferred',
	minBaseSalary: null,
	excludedKeywords: [],
	updatedAt: '2026-09-27T12:00:00.000Z'
};

function event(values?: Record<string, string>) {
	return {
		cookies: { get: () => 'backend-platform' },
		locals: { savedMatchProfile: { id: 'saved-profile' } },
		setHeaders: vi.fn(),
		request: new Request('https://example.test/discover?/search', values ? {
			method: 'POST',
			body: new URLSearchParams(values)
		} : {})
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	mocks.getProfile.mockReturnValue(profile);
	mocks.discoveryDefaults.mockReturnValue({ query: 'Platform Engineer', country: 'United States' });
});

describe('on-demand discovery route', () => {
	it('returns only search defaults on load without searching or exposing the private profile', async () => {
		const requestEvent = event();
		const result = await load(requestEvent as never);
		expect(result).toEqual({ defaults: { query: 'Platform Engineer', country: 'United States' } });
		expect(mocks.getProfile).toHaveBeenCalledWith('backend-platform', requestEvent.locals.savedMatchProfile);
		expect(mocks.discoverCompanies).not.toHaveBeenCalled();
		expect(requestEvent.setHeaders).toHaveBeenCalledWith({ 'cache-control': 'private, no-store' });
	});

	it('rejects invalid search parameters before contacting providers', async () => {
		for (const values of [
			{ query: 'x', country: 'US', fundingDays: '90' },
			{ query: 'Engineer', country: 'x'.repeat(81), fundingDays: '90' },
			{ query: 'Engineer', country: 'US', fundingDays: '365' }
		]) {
			const result = await actions.search(event(values) as never);
			expect(result).toMatchObject({ status: 400 });
		}
		expect(mocks.discoverCompanies).not.toHaveBeenCalled();
	});

	it('searches with the selected profile and keeps successful results private', async () => {
		const discovered = { jobs: [], funding: [], warnings: [], coverage: [] };
		mocks.discoverCompanies.mockResolvedValue(discovered);
		const requestEvent = event({ query: '  Platform   Engineer ', country: ' United States ', fundingDays: '30' });
		const result = await actions.search(requestEvent as never);
		expect(mocks.discoverCompanies).toHaveBeenCalledWith({
			query: 'Platform Engineer', country: 'United States', fundingDays: 30, profile
		});
		expect(result).toEqual({
			result: discovered, values: { query: 'Platform Engineer', country: 'United States', fundingDays: 30 }
		});
		expect(requestEvent.setHeaders).toHaveBeenCalledWith({ 'cache-control': 'private, no-store' });
	});

	it('distinguishes a provider failure from zero results and does not expose provider internals', async () => {
		mocks.discoverCompanies.mockRejectedValue(new Error('Sensitive provider diagnostic'));
		const result = await actions.search(event({ query: 'Engineer', country: 'US', fundingDays: '90' }) as never);
		expect(result).toMatchObject({
			status: 503,
			data: { error: expect.stringContaining('could not finish'), values: { query: 'Engineer' } }
		});
		expect(JSON.stringify(result)).not.toContain('Sensitive provider diagnostic');
		expect(JSON.stringify(result)).not.toContain('"result":');
	});

	it('does not set the same header again when a native POST reloads the page', async () => {
		const requestEvent = event({ query: 'Engineer', country: 'US', fundingDays: '90' });
		await load(requestEvent as never);
		expect(requestEvent.setHeaders).not.toHaveBeenCalled();
	});
});
