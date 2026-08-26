import { z } from 'zod';
import type { JobSource, NormalizedJob, SalaryRange } from '$lib/types';
import { extractPostedSalary } from '../salary';
import { safeBoardToken } from '../text';
import { fetchJson } from './http';

const compensationComponent = z.object({
	compensationType: z.string().nullable().optional(),
	interval: z.string().nullable().optional(),
	currencyCode: z.string().nullable().optional(),
	minValue: z.number().nullable().optional(),
	maxValue: z.number().nullable().optional()
});

const ashbyResponse = z.object({
	jobs: z.array(
		z.object({
			id: z.string(),
			title: z.string(),
			location: z
				.string()
				.nullish()
				.transform((value) => value ?? ''),
			secondaryLocations: z
				.array(
					z.object({
						location: z
							.string()
							.nullish()
							.transform((value) => value ?? '')
					})
				)
				.nullish()
				.transform((value) => value ?? []),
			publishedAt: z.string().nullable().optional(),
			isListed: z
				.boolean()
				.nullish()
				.transform((value) => value ?? true),
			isRemote: z
				.boolean()
				.nullish()
				.transform((value) => value ?? false),
			workplaceType: z.string().nullable().optional(),
			jobUrl: z.string().url(),
			applyUrl: z.string().url(),
			descriptionPlain: z
				.string()
				.nullish()
				.transform((value) => value ?? ''),
			compensation: z
				.object({
					summaryComponents: z
						.array(compensationComponent)
						.nullish()
						.transform((value) => value ?? [])
				})
				.nullable()
				.optional()
		})
	)
});

function structuredSalary(
	components: z.infer<typeof compensationComponent>[],
	sourceUrl: string
): SalaryRange | null {
	const component = components.find(
		(item) =>
			item.compensationType?.toLowerCase() === 'salary' &&
			item.interval?.toLowerCase().includes('year') &&
			item.minValue !== null &&
			item.minValue !== undefined &&
			item.maxValue !== null &&
			item.maxValue !== undefined
	);
	if (!component?.minValue || !component.maxValue) return null;
	return {
		min: Math.round(component.minValue),
		max: Math.round(component.maxValue),
		currency: component.currencyCode ?? 'USD',
		period: 'year',
		sourceType: 'employer_posted',
		sourceUrl
	};
}

export async function fetchAshby(source: JobSource): Promise<NormalizedJob[]> {
	const board = safeBoardToken(source.boardToken);
	const endpoint = `https://api.ashbyhq.com/posting-api/job-board/${board}?includeCompensation=true`;
	const payload = ashbyResponse.parse(await fetchJson(endpoint));

	return payload.jobs.filter((job) => job.isListed).map((job) => {
		const locations = [job.location, ...job.secondaryLocations.map((item) => item.location)].filter(Boolean);
		const location = [...new Set(locations)].join(' · ');
		const salary =
			structuredSalary(job.compensation?.summaryComponents ?? [], job.jobUrl) ??
			extractPostedSalary(job.descriptionPlain, job.jobUrl);
		return {
			externalId: job.id,
			company: source.name,
			title: job.title.trim(),
			location,
			remote: job.isRemote || /remote/i.test(`${job.workplaceType ?? ''} ${location}`),
			description: job.descriptionPlain.trim(),
			canonicalUrl: job.jobUrl,
			applyUrl: job.applyUrl,
			postedAt: job.publishedAt ?? null,
			updatedAt: null,
			salary
		};
	});
}
