import { describe, expect, it } from 'vitest';
import { jobsSnapshotSchema } from './jobs-snapshot';

const job = {
	externalId: 'fresh',
	company: 'Example',
	title: 'Software Engineer',
	location: 'Remote',
	remote: true,
	description: 'Build reliable software.',
	canonicalUrl: 'https://example.test/jobs/fresh',
	applyUrl: 'https://example.test/jobs/fresh/apply',
	postedAt: '2026-09-21T19:00:00.000Z',
	updatedAt: null,
	salary: null
};

function snapshot(overrides: Record<string, unknown> = {}) {
	return {
		version: 1,
		generatedAt: '2026-09-21T19:00:00.000Z',
		sources: [
			{ provider: 'ashby', boardToken: 'example', name: 'Example', error: null, jobs: [job] }
		],
		...overrides
	};
}

describe('published jobs snapshot', () => {
	it('accepts the format the nightly sweep writes', () => {
		expect(jobsSnapshotSchema.parse(snapshot()).sources[0].jobs).toEqual([job]);
	});

	it('rejects unknown versions, providers and malformed jobs', () => {
		for (const invalid of [
			snapshot({ version: 2 }),
			snapshot({ generatedAt: 'yesterday' }),
			snapshot({ sources: [{ provider: 'linkedin', boardToken: 'x', name: 'X', error: null, jobs: [] }] }),
			snapshot({
				sources: [
					{ provider: 'ashby', boardToken: 'x', name: 'X', error: null, jobs: [{ ...job, remote: 'yes' }] }
				]
			})
		])
			expect(jobsSnapshotSchema.safeParse(invalid).success).toBe(false);
	});
});
