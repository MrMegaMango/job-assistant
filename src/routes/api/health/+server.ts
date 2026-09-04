import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isHostedDemo } from '$lib/server/deployment';
import {
	DEMO_PROFILE_COOKIE,
	getDemoProfile,
	getSelectedDemoProfileId
} from '$lib/server/profile';
import { getProfile, getStats, listApplications, listSources } from '$lib/server/store';

export const GET: RequestHandler = ({ cookies, locals }) => {
	const hostedDemo = isHostedDemo();
	const demoProfileId = getSelectedDemoProfileId(cookies.get(DEMO_PROFILE_COOKIE));
	const profile = getProfile(demoProfileId, locals.savedMatchProfile);
	const stats = getStats();
	const sources = listSources();
	return json({
		status: 'ok',
		mode: hostedDemo ? 'disposable-hosted-demo' : 'local',
		profileSource: hostedDemo ? (locals.savedMatchProfile ? 'personal' : 'anonymous') : 'local',
		demoProfile: hostedDemo && !locals.savedMatchProfile
			? { id: demoProfileId, label: getDemoProfile(demoProfileId).label }
			: null,
		profileConfigured: Boolean(profile.targetTitles.length && profile.skills.length && profile.focusAreas.length),
		contactReady: Boolean(profile.name && profile.email && profile.phone && profile.resumePath),
		enabledSources: sources.filter((source) => source.enabled).length,
		activeJobs: stats.activeJobs,
		jobsWithPostedPay: stats.jobsWithPostedPay,
		applications: listApplications().length,
		sources: sources.map((source) => ({
			name: source.name,
			enabled: source.enabled,
			lastSyncedAt: source.lastSyncedAt,
			lastError: source.lastError
		}))
	});
};
