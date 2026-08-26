import type { SalaryRange } from '$lib/types';

const BLS_SOURCE = 'https://www.bls.gov/news.release/ocwage.t01.htm';

function parseAmount(raw: string, suffix: string | undefined): number {
	const numeric = Number(raw.replace(/,/g, ''));
	return Math.round(numeric * (suffix?.toLowerCase() === 'k' ? 1_000 : 1));
}

function plausibleAnnualRange(min: number, max: number): boolean {
	return min >= 20_000 && max <= 1_000_000 && max >= min && max / min <= 5;
}

export function extractPostedSalary(text: string, sourceUrl: string): SalaryRange | null {
	const patterns = [
		/(?:annual\s+)?(?:base\s+)?(?:salary|compensation|pay)(?:\s+range)?[^$]{0,60}\$\s*([0-9]+(?:\.[0-9]+)?(?:,[0-9]{3})*)(k)?\s*(?:-|–|—|to)\s*\$?\s*([0-9]+(?:\.[0-9]+)?(?:,[0-9]{3})*)(k)?/gi,
		/\$\s*([0-9]+(?:\.[0-9]+)?(?:,[0-9]{3})*)(k)?\s*(?:-|–|—|to)\s*\$?\s*([0-9]+(?:\.[0-9]+)?(?:,[0-9]{3})*)(k)?\s*(?:usd)?\s*(?:per\s+year|annually|annual)/gi
	];

	for (const pattern of patterns) {
		for (const match of text.matchAll(pattern)) {
			const min = parseAmount(match[1], match[2]);
			const max = parseAmount(match[3], match[4]);
			if (plausibleAnnualRange(min, max)) {
				return {
					min,
					max,
					currency: 'USD',
					period: 'year',
					sourceType: 'employer_posted',
					sourceUrl
				};
			}
		}
	}

	return null;
}

export function softwareDeveloperBenchmark(title: string): SalaryRange | null {
	if (!/(software|backend|platform|infrastructure|machine learning|\bml\b|\bai\b|distributed systems|developer)/i.test(title)) {
		return null;
	}

	return {
		min: 135_990,
		max: 148_100,
		currency: 'USD',
		period: 'year',
		sourceType: 'government_benchmark',
		sourceUrl: BLS_SOURCE,
		label: 'May 2025 U.S. BLS software-developer median to mean; broad market context, not this employer’s range'
	};
}

export function formatSalary(range: SalaryRange): string {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: range.currency,
		maximumFractionDigits: 0
	});
	return `${formatter.format(range.min)}–${formatter.format(range.max)}/${range.period}`;
}
