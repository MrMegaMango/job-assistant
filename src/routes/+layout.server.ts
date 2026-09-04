import type { LayoutServerLoad } from './$types';
import { isHostedDemo } from '$lib/server/deployment';
import {
	DEMO_PROFILE_COOKIE,
	getDemoProfile,
	getSelectedDemoProfileId,
	listDemoProfiles,
	toDemoProfileSummary
} from '$lib/server/profile';
import { getProfile, listApplications, listSources } from '$lib/server/store';
import { isSupabaseConfigured } from '$lib/server/supabase';

export const load: LayoutServerLoad = ({ cookies, locals, url }) => {
	const hostedDemo = isHostedDemo();
	const demoProfileId = getSelectedDemoProfileId(cookies.get(DEMO_PROFILE_COOKIE));
	const savedMatchProfile = hostedDemo ? locals.savedMatchProfile : null;
	const profile = getProfile(demoProfileId, savedMatchProfile);
	return {
		hostedDemo,
		profileReady: hostedDemo
			? Boolean(savedMatchProfile)
			: Boolean(profile.name && profile.email && profile.phone && profile.resumePath),
		enabledSourceCount: listSources().filter((source) => source.enabled).length,
		applicationCount: listApplications().length,
		demoProfiles: hostedDemo && !locals.user ? listDemoProfiles().map(toDemoProfileSummary) : [],
		activeDemoProfile:
			hostedDemo && !locals.user ? toDemoProfileSummary(getDemoProfile(demoProfileId)) : null,
		account: hostedDemo
			? {
					configured: isSupabaseConfigured(),
					signedIn: Boolean(locals.user),
					profileSaved: Boolean(savedMatchProfile),
					profileUnavailable: locals.savedMatchProfileUnavailable
				}
			: null,
		returnTo: `${url.pathname}${url.search}`
	};
};
