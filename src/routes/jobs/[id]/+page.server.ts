import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { HOSTED_DEMO_MESSAGE, isHostedDemo } from '$lib/server/deployment';
import {
	approveAndConsumeForOpen,
	confirmSubmitted,
	prepareApplication,
	shortlist
} from '$lib/server/applications';
import { softwareDeveloperBenchmark } from '$lib/server/salary';
import { getApplicationForJob, getJob } from '$lib/server/store';
import { ensureHostedJobs } from '$lib/server/sync';

function jobId(params: { id: string }): number {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(404, 'Job not found.');
	return id;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const id = jobId(params);
	let job = getJob(id);
	if (!job && isHostedDemo()) {
		await ensureHostedJobs();
		job = getJob(id);
	}
	if (!job) throw error(404, 'Job not found.');
	return {
		job,
		application: getApplicationForJob(id),
		benchmark: job.salary ? null : softwareDeveloperBenchmark(job.title),
		prepared: url.searchParams.get('prepared') === '1',
		submitted: url.searchParams.get('submitted') === '1'
	};
};

export const actions: Actions = {
	shortlist: ({ params }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		try {
			shortlist(jobId(params));
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Could not shortlist.' });
		}
		throw redirect(303, `/jobs/${params.id}`);
	},
	prepare: ({ params }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		try {
			prepareApplication(jobId(params));
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Could not prepare.' });
		}
		throw redirect(303, `/jobs/${params.id}?prepared=1`);
	},
	approve: ({ params }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		try {
			const target = approveAndConsumeForOpen(jobId(params));
			throw redirect(303, target);
		} catch (cause) {
			if (cause && typeof cause === 'object' && 'status' in cause) throw cause;
			return fail(400, { message: cause instanceof Error ? cause.message : 'Could not open application.' });
		}
	},
	confirm: async ({ params, request }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		const data = await request.formData();
		try {
			confirmSubmitted(jobId(params), String(data.get('confirmationId') ?? ''));
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Could not update application.' });
		}
		throw redirect(303, `/jobs/${params.id}?submitted=1`);
	}
};
