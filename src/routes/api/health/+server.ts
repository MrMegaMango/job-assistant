import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isHostedDemo } from '$lib/server/deployment';
import { getProfile, getStats, listApplications, listSources } from '$lib/server/store';

export const GET: RequestHandler = () => {
	const profile = getProfile();
	const stats = getStats();
	const sources = listSources();
	return json({
		status: 'ok',
		mode: isHostedDemo() ? 'disposable-hosted-demo' : 'local',
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
