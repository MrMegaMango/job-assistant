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

export const load: LayoutServerLoad = ({ cookies, url }) => {
	const hostedDemo = isHostedDemo();
	const demoProfileId = getSelectedDemoProfileId(cookies.get(DEMO_PROFILE_COOKIE));
	const profile = getProfile(demoProfileId);
	return {
		hostedDemo,
		profileReady: Boolean(profile.name && profile.email && profile.phone && profile.resumePath),
		enabledSourceCount: listSources().filter((source) => source.enabled).length,
		applicationCount: listApplications().length,
		demoProfiles: hostedDemo ? listDemoProfiles().map(toDemoProfileSummary) : [],
		activeDemoProfile: hostedDemo ? toDemoProfileSummary(getDemoProfile(demoProfileId)) : null,
		returnTo: `${url.pathname}${url.search}`
	};
};
