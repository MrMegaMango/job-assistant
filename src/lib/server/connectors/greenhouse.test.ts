import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobSource } from '$lib/types';
import { fetchGreenhouse } from './greenhouse';
import { fetchJson } from './http';

vi.mock('./http', () => ({ fetchJson: vi.fn() }));

const source: JobSource = {
	id: 1,
	provider: 'greenhouse',
	name: 'Example Company',
	boardToken: 'example',
	enabled: true,
	policyUrl: 'https://developer.greenhouse.io/job-board.html',
	applyMode: 'link_only',
	lastSyncedAt: null,
	lastError: null
};

beforeEach(() => {
	vi.mocked(fetchJson).mockReset();
});

describe('Greenhouse connector', () => {
	it('preserves the employer first-published timestamp', async () => {
		vi.mocked(fetchJson).mockResolvedValue({
			jobs: [
				{
					id: 123,
					title: 'Staff Platform Engineer',
					content: '<p>Build reliable infrastructure.</p>',
					absolute_url: 'https://job-boards.greenhouse.io/example/jobs/123',
					location: { name: 'Remote' },
					first_published: '2026-09-02T09:30:00-07:00',
					updated_at: '2026-09-03T08:00:00-07:00'
				}
			]
		});

		const jobs = await fetchGreenhouse(source);

		expect(jobs).toHaveLength(1);
		expect(jobs[0].postedAt).toBe('2026-09-02T09:30:00-07:00');
		expect(jobs[0].updatedAt).toBe('2026-09-03T08:00:00-07:00');
	});
});
