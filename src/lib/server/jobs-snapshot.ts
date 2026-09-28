import { z } from 'zod';
import { fetchJson } from './connectors/http';

/**
 * The owner's computer syncs every catalog source nightly (scripts/sweep.mjs) and publishes
 * the fresh remote jobs here. Hosted cold starts load this one small file instead of fetching
 * and parsing every employer feed from Vercel.
 */
export const JOBS_SNAPSHOT_URL = 'https://job-assistant-data.vercel.app/jobs.json';

const text = (max: number) => z.string().max(max);

const salarySchema = z.object({
	min: z.number().finite(),
	max: z.number().finite(),
	currency: text(10),
	period: z.enum(['year', 'hour', 'unknown']),
	sourceType: z.enum(['employer_posted', 'government_benchmark']),
	sourceUrl: text(2000),
	label: text(200).optional()
});

const jobSchema = z.object({
	externalId: z.string().min(1).max(500),
	company: text(300),
	title: text(500),
	location: text(500),
	remote: z.boolean(),
	description: text(500_000),
	canonicalUrl: text(2000),
	applyUrl: text(2000),
	postedAt: text(40).nullable(),
	updatedAt: text(40).nullable(),
	salary: salarySchema.nullable()
});

export const jobsSnapshotSchema = z.object({
	version: z.literal(1),
	generatedAt: z.iso.datetime(),
	sources: z
		.array(
			z.object({
				provider: z.enum(['greenhouse', 'ashby', 'lever', 'amazon', 'wwr']),
				boardToken: z.string().min(1).max(200),
				name: text(200),
				error: text(500).nullable(),
				jobs: z.array(jobSchema).max(5000)
			})
		)
		.max(2000)
});

export type JobsSnapshot = z.infer<typeof jobsSnapshotSchema>;

export async function fetchJobsSnapshot(): Promise<JobsSnapshot> {
	return jobsSnapshotSchema.parse(await fetchJson(JOBS_SNAPSHOT_URL));
}
