import type { LayoutServerLoad } from './$types';
import { isHostedDemo } from '$lib/server/deployment';
import { getProfile, listApplications, listSources } from '$lib/server/store';

export const load: LayoutServerLoad = () => {
	const profile = getProfile();
	return {
		hostedDemo: isHostedDemo(),
		profileReady: Boolean(profile.name && profile.email && profile.phone && profile.resumePath),
		enabledSourceCount: listSources().filter((source) => source.enabled).length,
		applicationCount: listApplications().length
	};
};
