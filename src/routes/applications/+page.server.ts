import type { PageServerLoad } from './$types';
import { listApplications } from '$lib/server/store';

export const load: PageServerLoad = () => ({
	applications: listApplications().map(({ job, ...application }) => ({
		...application,
		job: {
			id: job.id,
			company: job.company,
			title: job.title,
			location: job.location,
			applyUrl: job.applyUrl
		}
	}))
});
