import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { discoverCompanies, discoveryDefaults } from '$lib/server/live-discovery';
import { DEMO_PROFILE_COOKIE, getSelectedDemoProfileId } from '$lib/server/profile';
import { getProfile } from '$lib/server/store';

export const load: PageServerLoad = ({ cookies, locals, request, setHeaders }) => {
	// Non-enhanced POSTs run this load after the action has already set the header.
	if (request.method !== 'POST') setHeaders({ 'cache-control': 'private, no-store' });
	const demoProfileId = getSelectedDemoProfileId(cookies.get(DEMO_PROFILE_COOKIE));
	const profile = getProfile(demoProfileId, locals.savedMatchProfile);
	return { defaults: discoveryDefaults(profile) };
};

export const actions: Actions = {
	search: async ({ cookies, locals, request, setHeaders }) => {
		setHeaders({ 'cache-control': 'private, no-store' });
		const input = await request.formData();
		const query = String(input.get('query') ?? '').trim().replace(/\s+/g, ' ');
		const country = String(input.get('country') ?? '').trim();
		const fundingDays = Number(input.get('fundingDays') ?? 90);
		const values = { query, country, fundingDays };
		if (query.length < 2 || query.length > 120) {
			return fail(400, { error: 'Enter a role or topic between 2 and 120 characters.', values });
		}
		if (country.length > 80) {
			return fail(400, { error: 'Keep the country to 80 characters or fewer.', values });
		}
		if (fundingDays !== 30 && fundingDays !== 90) {
			return fail(400, { error: 'Choose a funding news window of 30 or 90 days.', values });
		}

		const demoProfileId = getSelectedDemoProfileId(cookies.get(DEMO_PROFILE_COOKIE));
		const profile = getProfile(demoProfileId, locals.savedMatchProfile);
		try {
			const result = await discoverCompanies({ query, country, fundingDays, profile });
			return { result, values };
		} catch {
			return fail(503, {
				error: 'Discovery could not finish. Try again in a moment. Your company list is still available.',
				values
			});
		}
	}
};
