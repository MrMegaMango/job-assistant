import type { JobSource } from '$lib/types';
import snapshot from './data/levels-companies.json';

export interface CompensationCompany {
	slug: string;
	name: string;
	levelsUrl: string;
	reportedAnnualUsd: number;
	role: string;
	level: string | null;
	location: string | null;
	sourceUpdatedAt: string | null;
	// Explicit reviewed identity mapping: similar company names are not sufficient.
	sourceKey: string | null;
}

export const COMPENSATION_COMPANIES: readonly CompensationCompany[] = snapshot.companies;

function sourceJobsUrl(source: JobSource): string | null {
	const token = encodeURIComponent(source.boardToken);
	switch (source.provider) {
		case 'greenhouse': return `https://job-boards.greenhouse.io/${token}`;
		case 'ashby': return `https://jobs.ashbyhq.com/${token}`;
		case 'lever': return `https://jobs.lever.co/${token}`;
		default: return null;
	}
}

export function listCompensationCompanies(sources: JobSource[]) {
	const byKey = new Map(sources.map((source) => [`${source.provider}:${source.boardToken}`, source]));
	return {
		checkedAt: snapshot.checkedAt,
		discoveredCompanies: snapshot.discoveredCompanies,
		checkedCompanies: snapshot.checkedCompanies,
		failedCompanies: snapshot.failedCompanies,
		companies: COMPENSATION_COMPANIES.map((company) => {
			const source = company.sourceKey ? byKey.get(company.sourceKey) ?? null : null;
			return {
				...company,
				source,
				jobsUrl: (source && sourceJobsUrl(source)) ?? `https://www.levels.fyi/companies/${encodeURIComponent(company.slug)}/jobs`
			};
		}).sort((a, b) => a.name.localeCompare(b.name, 'en-US'))
	};
}
