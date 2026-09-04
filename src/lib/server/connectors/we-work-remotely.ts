import type { JobSource, NormalizedJob } from '$lib/types';
import { extractPostedSalary } from '../salary';
import { htmlToText, safeBoardToken } from '../text';
import { fetchText } from './http';

const FEED_URLS: Record<string, readonly string[]> = {
	'remote-engineering': [
		'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
		'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
		'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss'
	]
};

function readTag(item: string, tag: string): string {
	const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = item.match(new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'));
	return (match?.[1] ?? '').replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
}

function parseDate(value: string): string | null {
	if (!value) return null;
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function canonicalListingUrl(value: string): string {
	const url = new URL(htmlToText(value));
	if (
		url.protocol !== 'https:' ||
		url.hostname !== 'weworkremotely.com' ||
		!url.pathname.startsWith('/remote-jobs/')
	) {
		throw new Error('We Work Remotely returned an unexpected listing URL.');
	}
	return url.toString();
}

function companyAndTitle(value: string): { company: string; title: string } {
	const normalized = htmlToText(value);
	const separator = normalized.indexOf(':');
	if (separator < 1) return { company: 'We Work Remotely', title: normalized };
	return {
		company: normalized.slice(0, separator).trim(),
		title: normalized.slice(separator + 1).trim()
	};
}

export async function fetchWeWorkRemotely(source: JobSource): Promise<NormalizedJob[]> {
	const feedKey = safeBoardToken(source.boardToken);
	const endpoints = FEED_URLS[feedKey];
	if (!endpoints) throw new Error('Unknown We Work Remotely feed.');

	const feeds = await Promise.all(
		endpoints.map((endpoint) =>
			fetchText(endpoint, 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8')
		)
	);
	const items = feeds.flatMap((xml) =>
		[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1])
	);
	if (items.length === 0) throw new Error('We Work Remotely returned no readable listings.');

	const jobs = items.flatMap((item) => {
		try {
			const canonicalUrl = canonicalListingUrl(readTag(item, 'link') || readTag(item, 'guid'));
			const { company, title } = companyAndTitle(readTag(item, 'title'));
			if (!title) return [];
			const region = htmlToText(readTag(item, 'region'));
			const country = htmlToText(readTag(item, 'country'));
			const state = htmlToText(readTag(item, 'state'));
			const location = region || (country.length <= 120 ? country : '') || state || 'Remote';
			const description = [
				readTag(item, 'type') ? `Schedule: ${htmlToText(readTag(item, 'type'))}` : '',
				readTag(item, 'category') ? `Category: ${htmlToText(readTag(item, 'category'))}` : '',
				readTag(item, 'skills') ? `Skills: ${htmlToText(readTag(item, 'skills'))}` : '',
				htmlToText(readTag(item, 'description'))
			]
				.filter(Boolean)
				.join('\n\n');

			return [
				{
					externalId: canonicalUrl,
					company,
					title,
					location,
					remote: true,
					description,
					canonicalUrl,
					applyUrl: canonicalUrl,
					postedAt: parseDate(readTag(item, 'pubDate')),
					updatedAt: null,
					salary: extractPostedSalary(description, canonicalUrl)
				}
			];
		} catch {
			return [];
		}
	});
	if (jobs.length === 0) throw new Error('We Work Remotely returned no valid listing URLs.');
	return [...new Map(jobs.map((job) => [job.canonicalUrl, job])).values()];
}
