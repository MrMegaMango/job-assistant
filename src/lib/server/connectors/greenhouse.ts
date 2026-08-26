import { z } from 'zod';
import type { JobSource, NormalizedJob } from '$lib/types';
import { extractPostedSalary } from '../salary';
import { htmlToText, safeBoardToken } from '../text';
import { fetchJson } from './http';

const greenhouseResponse = z.object({
	jobs: z.array(
		z.object({
			id: z.union([z.number(), z.string()]),
			title: z.string(),
			content: z.string().default(''),
			absolute_url: z.string().url(),
			location: z.object({ name: z.string().default('') }).default({ name: '' }),
			updated_at: z.string().nullable().optional()
		})
	)
});

export async function fetchGreenhouse(source: JobSource): Promise<NormalizedJob[]> {
	const board = safeBoardToken(source.boardToken);
	const endpoint = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
	const payload = greenhouseResponse.parse(await fetchJson(endpoint));

	return payload.jobs.map((job) => {
		const description = htmlToText(job.content);
		const location = job.location.name.trim();
		return {
			externalId: String(job.id),
			company: source.name,
			title: job.title.trim(),
			location,
			remote: /remote/i.test(location),
			description,
			canonicalUrl: job.absolute_url,
			applyUrl: job.absolute_url,
			postedAt: null,
			updatedAt: job.updated_at ?? null,
			salary: extractPostedSalary(description, job.absolute_url)
		};
	});
}
