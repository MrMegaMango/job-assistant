import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { shortlist } from '$lib/server/applications';
import { HOSTED_DEMO_MESSAGE, isHostedDemo } from '$lib/server/deployment';
import { listRankedJobs, getProfile } from '$lib/server/store';
import { syncEnabledSources } from '$lib/server/sync';

export const load: PageServerLoad = ({ url }) => {
	const requestedMinimum = Number(url.searchParams.get('minimumScore') ?? 35);
	const minimumScore = Number.isFinite(requestedMinimum)
		? Math.min(95, Math.max(0, requestedMinimum))
		: 35;
	const jobs = listRankedJobs({ minimumScore, limit: 120 }).map(({ description, ...job }) => ({
		...job,
		excerpt: description.slice(0, 420)
	}));
	const profile = getProfile();
	return {
		jobs,
		minimumScore,
		profileComplete: Boolean(profile.name && profile.email && profile.phone && profile.resumePath)
	};
};

export const actions: Actions = {
	sync: async () => {
		const syncResults = await syncEnabledSources();
		return { syncResults };
	},
	shortlist: async ({ request }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		const data = await request.formData();
		const id = Number(data.get('jobId'));
		if (!Number.isInteger(id) || id <= 0) return fail(400, { message: 'Invalid job.' });
		try {
			shortlist(id);
			return { message: 'Job shortlisted.' };
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Could not shortlist job.' });
		}
	}
};
