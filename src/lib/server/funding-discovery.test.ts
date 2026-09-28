import { describe, expect, it } from 'vitest';
import { fundingCompany, parseFundingFeed } from './funding-discovery';

const now = Date.parse('2026-09-27T20:00:00Z');
function item(title: string, date = '2026-09-24T12:00:00Z', link = 'https://techcrunch.com/2026/09/24/example/') {
	return `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate></item>`;
}

describe('funding discovery evidence', () => {
	it('extracts conservative company subjects from funding reports', () => {
		expect(fundingCompany('AI startup Example Labs raises $25M in Series A funding')).toBe('Example Labs');
		expect(fundingCompany('Exclusive: From calls to check-ins, Dextr AI Raises $6.7M')).toBe('Dextr AI');
		expect(fundingCompany('Ahead of US IPO, British AI neocloud Nscale secures $3.36B in convertible financing')).toBe('Nscale');
		expect(fundingCompany('A startup raises $25M')).toBeNull();
	});
	it('preserves publication date without treating it as a round date or proof of hiring', () => {
		const [lead] = parseFundingFeed(item('Example Labs raises $25M in Series A'), 'TechCrunch', 30, now);
		expect(lead).toMatchObject({company: 'Example Labs', publishedAt: '2026-09-24T12:00:00.000Z', hiringStatus: 'not_checked', jobCount: 0});
		expect(lead).not.toHaveProperty('roundDate');
	});
	it('excludes rumors, funds, stale and future reports, and unsafe citation URLs', () => {
		const xml = [
			item('Example Labs in talks to raise $25M'),
			item('Example Capital raises $25M fund'),
			item('Example raises $25M', '2026-01-01T00:00:00Z'),
			item('Example raises $25M', '2026-10-01T00:00:00Z'),
			item('Example raises $25M', 'invalid'),
			item('Example raises $25M', undefined, 'javascript:alert(1)'),
			item('Example raises $25M', undefined, 'https://localhost/internal'),
			item('Example raises $25M', undefined, 'https://techcrunch.com.evil.test/article')
		].join('');
		expect(parseFundingFeed(xml, 'TechCrunch', 90, now)).toEqual([]);
	});
	it('keeps unattributable report subjects unknown', () => {
		const [lead] = parseFundingFeed(item('An unnamed startup raises $25M'), 'TechCrunch', 90, now);
		expect(lead.company).toBeNull();
	});
	it('distinguishes financing from acquisitions, contracts, and product announcements', () => {
		const xml = [
			item('Google announces $32B acquisition of Wiz'),
			item('Google announces $32B acquisition of Wiz').replace('</item>', '<description>Wiz raised $1 billion last year.</description></item>'),
			item('ContractCo lands $200M government contract'),
			item('ProductCo announces $20M product launch'),
			item('Prezent raises $30 million to acquire AI services firms'),
			item('Example announces $20M seed round')
		].join('');
		expect(parseFundingFeed(xml, 'TechCrunch', 90, now).map((lead) => lead.company)).toEqual(['Prezent', 'Example']);
	});
});
