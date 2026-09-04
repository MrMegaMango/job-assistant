import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobSource } from '$lib/types';
import { fetchText } from './http';
import { fetchWeWorkRemotely } from './we-work-remotely';

vi.mock('./http', () => ({ fetchText: vi.fn() }));

const source: JobSource = {
	id: 1,
	provider: 'wwr',
	name: 'We Work Remotely – Engineering',
	boardToken: 'remote-engineering',
	enabled: true,
	policyUrl: 'https://weworkremotely.com/remote-job-rss-feed',
	applyMode: 'link_only',
	lastSyncedAt: null,
	lastError: null
};

beforeEach(() => vi.mocked(fetchText).mockReset());

describe('We Work Remotely connector', () => {
	it('normalizes a public RSS listing and preserves its publication time', async () => {
		vi.mocked(fetchText).mockResolvedValue(`
			<rss><channel><item>
				<title>Example Co: Senior Backend Engineer</title>
				<region>USA Only</region>
				<category>Back-End Programming</category>
				<type>Contract</type>
				<skills>Go, APIs</skills>
				<description>&lt;p&gt;Build APIs. $180,000-$210,000 USD annually.&lt;/p&gt;</description>
				<pubDate>Fri, 04 Sep 2026 18:52:20 +0000</pubDate>
				<link>https://weworkremotely.com/remote-jobs/example-co-senior-backend-engineer</link>
			</item></channel></rss>
		`);

		const jobs = await fetchWeWorkRemotely(source);

		expect(jobs).toHaveLength(1);
		expect(jobs[0]).toMatchObject({
			company: 'Example Co',
			title: 'Senior Backend Engineer',
			location: 'USA Only',
			remote: true,
			postedAt: '2026-09-04T18:52:20.000Z'
		});
		expect(jobs[0].description).toContain('Schedule: Contract');
		expect(jobs[0].salary).toMatchObject({ min: 180000, max: 210000 });
		expect(fetchText).toHaveBeenCalledTimes(3);
	});

	it('rejects unknown feed keys instead of fetching arbitrary URLs', async () => {
		await expect(fetchWeWorkRemotely({ ...source, boardToken: 'other-feed' })).rejects.toThrow(
			'Unknown We Work Remotely feed.'
		);
		expect(fetchText).not.toHaveBeenCalled();
	});

	it('fails closed when the feed contains no valid listing URLs', async () => {
		vi.mocked(fetchText).mockResolvedValue(`
			<rss><channel><item>
				<title>Example Co: Engineer</title>
				<link>https://example.com/untrusted-listing</link>
			</item></channel></rss>
		`);

		await expect(fetchWeWorkRemotely(source)).rejects.toThrow(
			'We Work Remotely returned no valid listing URLs.'
		);
	});
});
