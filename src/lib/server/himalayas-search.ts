import type { StartupJob } from './startup-search';
import { discoveryText, publicHttpsUrl } from './live-discovery-http';
import { htmlToText } from './text';

function timestamp(value: unknown): string | null {
	const time = typeof value === 'number' ? value * 1000 : typeof value === 'string' ? Date.parse(value) : NaN;
	return Number.isFinite(time) && time > 0 && time < 8.64e15 ? new Date(time).toISOString() : null;
}

export function parseHimalayasJobs(payload: unknown, now = Date.now()): StartupJob[] {
	if (!payload || typeof payload !== 'object' || !('jobs' in payload) || !Array.isArray(payload.jobs)) {
		throw new Error('Himalayas returned an unexpected response.');
	}
	return payload.jobs.slice(0, 40).flatMap((item) => {
		try {
			if (!item || typeof item !== 'object') return [];
			const title = typeof item.title === 'string' ? htmlToText(item.title).slice(0, 300) : '';
			const company = typeof item.companyName === 'string' ? htmlToText(item.companyName).slice(0, 160) : '';
			const listingUrl = publicHttpsUrl(item.guid);
			if (!title || !company || !listingUrl || new URL(listingUrl).hostname !== 'himalayas.app' || !new URL(listingUrl).pathname.includes('/jobs/')) return [];
			const postedAt = timestamp(item.pubDate);
			const expiresAt = timestamp(item.expiryDate);
			if ((expiresAt && Date.parse(expiresAt) <= now) || (postedAt && Date.parse(postedAt) > now)) return [];
			const locations = Array.isArray(item.locationRestrictions)
				? item.locationRestrictions.filter((v: unknown) => typeof v === 'string').slice(0, 20) : [];
			const description = typeof item.description === 'string' ? htmlToText(item.description.slice(0, 80_000)) : '';
			const min = item.minSalary; const max = item.maxSalary;
			const currency = typeof item.currency === 'string' && /^[A-Z]{3}$/.test(item.currency) ? item.currency : null;
			const period = typeof item.salaryPeriod === 'string' ? item.salaryPeriod.slice(0, 30) : 'period unspecified';
			const listedSalary = currency && Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min
				? `${currency} ${min.toLocaleString('en-US')}–${max.toLocaleString('en-US')} / ${period}` : null;
			return [{ company, companySlug: typeof item.companySlug === 'string' ? item.companySlug : '', companyWebsite: null,
				title, description, location: locations.join(', ') || 'Remote · location restrictions not listed', remote: true,
				listingUrl, employerUrl: null, postedAt, listedSalary, expiresAt }];
		} catch { return []; }
	});
}

export async function searchHimalayas(query: string, country: string): Promise<StartupJob[]> {
	const url = new URL('https://himalayas.app/jobs/api/search');
	url.searchParams.set('q', query);
	if (country) url.searchParams.set('country', country);
	url.searchParams.set('sort', 'recent');
	url.searchParams.set('page', '1');
	return parseHimalayasJobs(JSON.parse(await discoveryText(url)));
}
