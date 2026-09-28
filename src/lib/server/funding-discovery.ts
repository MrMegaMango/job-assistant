import type { FundingLead } from '$lib/discovery-types';
import { discoveryText, publicHttpsUrl } from './live-discovery-http';
import { htmlToText } from './text';

const FEEDS = [
	{ publisher: 'TechCrunch', url: 'https://techcrunch.com/?s=raises&feed=rss2&orderby=date' },
	{ publisher: 'TechCrunch', url: 'https://techcrunch.com/category/venture/feed/' },
	{ publisher: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/' }
];

function tag(item: string, name: string): string {
	return (item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? '')
		.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
}

export function companyKey(value: string): string {
	return value.toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]/gu, '');
}

// Headlines are evidence to inspect, not commands. Be conservative: ambiguous subjects stay unknown.
export function fundingCompany(title: string, description = ''): string | null {
	const text = `${title}. ${description}`;
	const phrases = [...text.matchAll(/([^.!?;:]+?)\s+(?:(?:has|have|just)\s+)?(?:raises?|raised|secures?|secured|lands?|landed|closes?|closed|announces?|announced)\b/gi)];
	for (const phrase of phrases) {
		const subject = phrase[1].split(/[,—]/).at(-1)?.trim() ?? '';
		const words = subject.split(/\s+/);
		const names: string[] = [];
		for (let i = words.length - 1; i >= 0 && names.length < 5; i--) {
			if (!/^[\p{Lu}\d][\p{L}\p{N}.&’'\-]*$/u.test(words[i])) break;
			names.unshift(words[i]);
		}
		const name = names.join(' ');
		if (!name || name.length > 80 || /\b(?:Exclusive|Startup|Startups|Company|Companies|Fund|Funds|VC|Capital|Here|It|They|The|This|AI|US|UK)\b/.test(name.replace(/\bAI$/, ''))) continue;
		if (name === 'AI' || name === 'Series' || name === 'Funding') continue;
		return name;
	}
	return null;
}

export function parseFundingFeed(xml: string, publisher: string, days: number, now: number): FundingLead[] {
	const oldest = now - days * 86_400_000;
	return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
		try {
			const item = match[1];
			const title = htmlToText(tag(item, 'title')).slice(0, 350);
			const description = htmlToText(tag(item, 'description')).slice(0, 1500);
			const url = publicHttpsUrl(htmlToText(tag(item, 'link')));
			const published = Date.parse(tag(item, 'pubDate'));
			if (!url || !['techcrunch.com', 'news.crunchbase.com'].includes(new URL(url).hostname) ||
				!Number.isFinite(published) || published > now || published < oldest) return [];
			// Exclude rumored/planned financing and generic roundups. Publication != closing date.
			if (/\b(?:in talks|rumou?red|plans to|seeks|seeking|targets|reportedly|could raise|to raise|raising)\b/i.test(title) ||
				/\b(?:funds?|venture capital|roundup|biggest funding rounds)\b/i.test(title)) return [];
			const text = `${title} ${description}`;
			if (!/\b(?:raises?|raised|secures?|secured|closes?|closed|lands?|landed|announces?|announced)\b/i.test(text) ||
				!/(?:[$€£]\s?\d|\b(?:funding|financing|series [a-z]|seed round)\b)/i.test(text)) return [];
			const directRaise = /\b(?:raises|raised)\s+(?:another\s+)?[$€£]\s?\d+(?:[,.]\d+)*\s?(?:[MBK]\b|million\b|billion\b)/i.test(title);
			const financing = /\b(?:funding|financing|(?:seed|series [a-z])(?:\s+round)?|round|raise)\b/i.test(title);
			if (!directRaise && (!financing || /\b(?:acquisition|acquires?|contract|product launch)\b/i.test(title))) return [];
			return [{
				id: url, company: fundingCompany(title, description), title, url, publisher,
				publishedAt: new Date(published).toISOString(), knownCompany: false,
				jobCount: 0, hiringStatus: 'not_checked' as const
			}];
		} catch { return []; }
	});
}

export async function discoverFunding(days: number, now = Date.now()): Promise<{ leads: FundingLead[]; warnings: string[] }> {
	const results = await Promise.allSettled(FEEDS.map(async (feed) =>
		parseFundingFeed(await discoveryText(new URL(feed.url)), feed.publisher, days, now)));
	const leads = new Map<string, FundingLead>();
	const warnings: string[] = [];
	results.forEach((result, i) => {
		if (result.status === 'fulfilled') result.value.forEach((lead) => leads.set(lead.url, lead));
		else warnings.push(`${FEEDS[i].publisher} funding feed could not be checked. Try again later.`);
	});
	return {
		leads: [...leads.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 16),
		warnings: [...new Set(warnings)]
	};
}
