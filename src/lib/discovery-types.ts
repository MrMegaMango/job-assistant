import type { MatchResult } from './types';

export interface FundingLead {
	id: string;
	company: string | null;
	title: string;
	url: string;
	publisher: string;
	publishedAt: string;
	knownCompany: boolean;
	jobCount: number;
	hiringStatus: 'indexed_openings' | 'not_found' | 'not_checked' | 'unavailable' | 'ambiguous';
}

export interface DiscoveredJob {
	id: string;
	company: string;
	title: string;
	location: string;
	remote: boolean;
	listingUrl: string;
	source: 'Startup Jobs' | 'Himalayas';
	employerUrl: string | null;
	companyWebsite: string | null;
	postedAt: string | null;
	listedSalary: string | null;
	excerpt: string;
	match: MatchResult;
	knownCompany: boolean;
	funding: FundingLead[];
}

export interface LiveDiscoveryResult {
	searchedAt: string;
	query: string;
	country: string;
	fundingDays: number;
	jobs: DiscoveredJob[];
	funding: FundingLead[];
	warnings: string[];
	coverage: string[];
}
