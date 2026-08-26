import { z } from 'zod';
import type { JobSource, NormalizedJob, SalaryRange } from '$lib/types';
import { extractPostedSalary } from '../salary';
import { safeBoardToken } from '../text';
import { fetchJson } from './http';

const leverPosting = z.object({
	id: z.string(),
	text: z.string(),
	descriptionPlain: z.string().default(''),
	additionalPlain: z.string().default(''),
	createdAt: z.number().nullable().optional(),
	categories: z
		.object({
			location: z.string().default(''),
			allLocations: z.array(z.string()).default([]),
			commitment: z.string().default('')
		})
		.default({ location: '', allLocations: [], commitment: '' }),
	hostedUrl: z.string().url(),
	applyUrl: z.string().url(),
	salaryRange: z
		.object({
			min: z.number(),
			max: z.number(),
			currency: z.string().default('USD'),
			interval: z.string().default('')
		})
		.nullable()
		.optional()
});

function structuredSalary(
	range: z.infer<typeof leverPosting>['salaryRange'],
	sourceUrl: string
): SalaryRange | null {
	if (!range || !/year|annual/i.test(range.interval)) return null;
	return {
		min: Math.round(range.min),
		max: Math.round(range.max),
		currency: range.currency,
		period: 'year',
		sourceType: 'employer_posted',
		sourceUrl
	};
}

export async function fetchLever(source: JobSource): Promise<NormalizedJob[]> {
	const board = safeBoardToken(source.boardToken);
	const endpoint = `https://api.lever.co/v0/postings/${board}?mode=json`;
	const payload = z.array(leverPosting).parse(await fetchJson(endpoint));

	return payload.map((job) => {
		const location = [...new Set([job.categories.location, ...job.categories.allLocations].filter(Boolean))].join(' · ');
		const description = `${job.descriptionPlain}\n\n${job.additionalPlain}`.trim();
		return {
			externalId: job.id,
			company: source.name,
			title: job.text.trim(),
			location,
			remote: /remote/i.test(location),
			description,
			canonicalUrl: job.hostedUrl,
			applyUrl: job.applyUrl,
			postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
			updatedAt: null,
			salary:
				structuredSalary(job.salaryRange, job.hostedUrl) ??
				extractPostedSalary(description, job.hostedUrl)
		};
	});
}
