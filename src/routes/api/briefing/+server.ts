import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAX_LISTING_AGE_DAYS } from '$lib/server/listing-age';
import { softwareDeveloperBenchmark } from '$lib/server/salary';
import { listRankedJobs } from '$lib/server/store';
import { ensureHostedJobs } from '$lib/server/sync';

export const GET: RequestHandler = async ({ url }) => {
	const generatedAt = new Date();
	const requestedLimit = Number(url.searchParams.get('limit') ?? 10);
	const requestedMinimum = Number(url.searchParams.get('minimumScore') ?? 65);
	const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, requestedLimit)) : 10;
	const minimumScore = Number.isFinite(requestedMinimum)
		? Math.max(0, Math.min(95, requestedMinimum))
		: 65;
	await ensureHostedJobs();
	const jobs = listRankedJobs({ limit, minimumScore, now: generatedAt }).map((job) => ({
		id: job.id,
		company: job.company,
		title: job.title,
		location: job.location,
		remote: job.remote,
		postedAt: job.postedAt,
		listingAgeDays: job.listingAge?.days ?? null,
		listingAgeLabel: job.listingAge?.label ?? null,
		matchScore: job.match.score,
		confidence: job.match.confidence,
		strengths: job.match.strengths,
		gaps: job.match.gaps,
		unknowns: job.match.unknowns,
		compensation: job.salary ?? softwareDeveloperBenchmark(job.title),
		compensationIsEmployerPosted: Boolean(job.salary),
		canonicalUrl: job.canonicalUrl,
		applicationState: job.applicationState
	}));
	return json({
		generatedAt: generatedAt.toISOString(),
		minimumScore,
		maximumListingAgeDays: MAX_LISTING_AGE_DAYS,
		jobs
	});
};
