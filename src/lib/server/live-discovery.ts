import type { CandidateProfile, NormalizedJob } from '$lib/types';
import type { DiscoveredJob, FundingLead, LiveDiscoveryResult } from '$lib/discovery-types';
import { COMPENSATION_COMPANIES } from './levels-companies';
import { DEFAULT_SOURCES } from './source-catalog';
import { companyKey, discoverFunding } from './funding-discovery';
import { searchHimalayas } from './himalayas-search';
import { findStartupCompanyJobs, searchStartupJobs, type StartupJob } from './startup-search';
import { scoreJob } from './scoring';

const knownCompanies = new Set([...COMPENSATION_COMPANIES, ...DEFAULT_SOURCES].map((company) => companyKey(company.name)));

function fundingRoleInRegion(job: StartupJob, country: string): boolean {
	if (!job.remote) return false;
	if (!country) return true;
	if (/\b(?:worldwide|anywhere|global)\b/i.test(job.location)) return true;
	const aliases: Record<string, string> = { usa: 'United States', us: 'United States', uk: 'United Kingdom', gb: 'United Kingdom' };
	const names = new Intl.DisplayNames(['en'], { type: 'region' });
	const normalize = (value: string) => {
		const trimmed = value.trim();
		return companyKey(aliases[trimmed.toLowerCase()] ?? (/^[a-z]{2}$/i.test(trimmed) ? names.of(trimmed.toUpperCase()) ?? trimmed : trimmed));
	};
	return job.location.split(/[,;/]/).some((location) => normalize(location) === normalize(country));
}

export function discoveryDefaults(profile: CandidateProfile): { query: string; country: string } {
	return {
		query: profile.targetTitles[0]?.slice(0, 120) || 'software engineer',
		country: profile.preferredLocations.some((location) => /\b(?:US|USA|United States|California)\b/i.test(location)) ? 'United States' : ''
	};
}

function rankedJob(job: StartupJob, source: DiscoveredJob['source'], profile: CandidateProfile, funding: FundingLead[]): DiscoveredJob {
	const normalized: NormalizedJob = {
		externalId: job.listingUrl, company: job.company, title: job.title, location: job.location,
		remote: job.remote, description: job.description, canonicalUrl: job.listingUrl,
		applyUrl: job.employerUrl ?? job.listingUrl, postedAt: job.postedAt, updatedAt: null,
		// An aggregator's pay range is not verified employer-posted compensation.
		salary: null
	};
	const match = scoreJob(profile, normalized);
	match.unknowns = [...new Set([...match.unknowns,
		'Opening and application destination need confirmation on the employer’s site.',
		...(job.description ? [] : ['The search source did not return the full job description.'])])];
	if (!job.description) match.confidence = Math.min(match.confidence, 35);
	return {
		id: job.listingUrl, company: job.company, title: job.title, location: job.location,
		remote: job.remote, listingUrl: job.listingUrl, source, employerUrl: job.employerUrl,
		companyWebsite: job.companyWebsite, postedAt: job.postedAt, listedSalary: job.listedSalary,
		excerpt: job.description.slice(0, 360), match, knownCompany: knownCompanies.has(companyKey(job.company)),
		funding: funding.filter((lead) => lead.hiringStatus !== 'ambiguous' && lead.company && companyKey(lead.company) === companyKey(job.company))
	};
}

export async function discoverCompanies(input: {
	query: string; country: string; fundingDays: 30 | 90; profile: CandidateProfile;
}): Promise<LiveDiscoveryResult> {
	const query = input.query.trim();
	const country = input.country.trim();
	if (!query || query.length > 120 || country.length > 80 || ![30, 90].includes(input.fundingDays)) {
		throw new Error('Enter a role or topic of up to 120 characters and choose a 30- or 90-day funding window.');
	}
	// Only these editable search fields leave the server. Identity/resume/profile data stay here.
	const [startup, himalayas, fundingResult] = await Promise.allSettled([
		searchStartupJobs(query, country), searchHimalayas(query, country), discoverFunding(input.fundingDays)
	]);
	const warnings: string[] = [];
	const sourced: Array<{ job: StartupJob; source: DiscoveredJob['source'] }> = [];
	if (startup.status === 'fulfilled') sourced.push(...startup.value.jobs.map((job) => ({ job, source: 'Startup Jobs' as const })));
	else warnings.push('Startup Jobs search is unavailable. Its coverage is missing from this search.');
	if (himalayas.status === 'fulfilled') sourced.push(...himalayas.value.map((job) => ({ job, source: 'Himalayas' as const })));
	else warnings.push('Himalayas search is unavailable. Its coverage is missing from this search.');
	const funding = fundingResult.status === 'fulfilled' ? fundingResult.value.leads : [];
	if (fundingResult.status === 'fulfilled') warnings.push(...fundingResult.value.warnings);
	else warnings.push('Funding reports could not be checked.');

	for (const lead of funding) {
		lead.knownCompany = Boolean(lead.company && knownCompanies.has(companyKey(lead.company)));
	}
	// Check two distinct employers per request to respect the public search provider's budget.
	const candidates = [...new Map(funding.filter((lead) => lead.company)
		.sort((a, b) => Number(companyKey(b.company!) === companyKey(query)) - Number(companyKey(a.company!) === companyKey(query)) ||
			Number(a.knownCompany) - Number(b.knownCompany) || b.publishedAt.localeCompare(a.publishedAt))
		.map((lead) => [companyKey(lead.company!), lead])).values()].slice(0, 2);
	const hiring = await Promise.allSettled(candidates.map((lead) => findStartupCompanyJobs(lead.company!)));
	hiring.forEach((result, index) => {
		const key = companyKey(candidates[index].company!);
		const related = funding.filter((lead) => lead.company && companyKey(lead.company) === key);
		if (result.status === 'rejected') {
			const ambiguous = result.reason instanceof Error && result.reason.name === 'AmbiguousCompanyError';
			related.forEach((lead) => { lead.hiringStatus = ambiguous ? 'ambiguous' : 'unavailable'; });
			warnings.push(ambiguous
				? `Multiple employers named ${candidates[index].company} were found. Their jobs have not been linked to the funding report.`
				: `Hiring lookup for ${candidates[index].company} is unavailable. The funding report is still available.`);
			return;
		}
		const jobs = result.value.jobs.filter((job) => companyKey(job.company) === key);
		related.forEach((lead) => {
			lead.jobCount = jobs.length;
			lead.hiringStatus = jobs.length ? 'indexed_openings' : 'not_found';
		});
		sourced.push(...jobs.filter((job) => fundingRoleInRegion(job, country)).map((job) => ({ job, source: 'Startup Jobs' as const })));
	});

	// Broad job-search hits also establish indexed hiring evidence for matching report subjects.
	for (const lead of funding) {
		if (!lead.company || lead.hiringStatus === 'ambiguous') continue;
		const matches = sourced.filter(({ job }) => companyKey(job.company) === companyKey(lead.company!));
		const providers = new Set(matches.map(({ source }) => source));
		const ambiguous = [...providers].some((provider) =>
			new Set(matches.filter(({ source }) => source === provider).map(({ job }) => job.companySlug).filter(Boolean)).size > 1);
		if (ambiguous) { lead.hiringStatus = 'ambiguous'; lead.jobCount = 0; continue; }
		if (matches.length) {
			lead.jobCount = Math.max(lead.jobCount, new Set(matches.map(({ job }) => job.listingUrl)).size);
			lead.hiringStatus = 'indexed_openings';
		}
	}
	const jobs = new Map<string, DiscoveredJob>();
	for (const { job, source } of sourced) {
		const ranked = rankedJob(job, source, input.profile, funding);
		if (ranked.match.hardRejected) continue;
		const locationKey = companyKey(job.location.replace(/\b(?:USA?|United States of America)\b/gi, 'United States'));
		const key = `${companyKey(job.company)}:${companyKey(job.title)}:${locationKey}`;
		const previous = jobs.get(key);
		if (!previous || ranked.match.confidence > previous.match.confidence) {
			if (previous && !ranked.companyWebsite) ranked.companyWebsite = previous.companyWebsite;
			jobs.set(key, ranked);
		}
	}
	return {
		searchedAt: new Date().toISOString(), query, country, fundingDays: input.fundingDays,
		jobs: [...jobs.values()].sort((a, b) => b.match.score - a.match.score || b.match.confidence - a.match.confidence).slice(0, 60),
		funding: funding.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), warnings: [...new Set(warnings)],
		coverage: [
			'Company list and regular employer-feed checks are unchanged. New employers can appear without being on that list.',
			'Searches Startup Jobs and Himalayas remote listings. Results are a bounded sample, not complete market coverage; Himalayas refreshes daily.',
			'Reads recent TechCrunch and Crunchbase News funding reports and checks up to two newly reported employers for indexed openings.',
			'Funding is a discovery signal, separate from fit. Report dates are publication dates; company-name matches and openings need employer confirmation.'
		]
	};
}
