import type { PageServerLoad } from './$types';
import { listCompensationCompanies } from '$lib/server/levels-companies';
import { listSources } from '$lib/server/store';

const PAGE_SIZE = 24;

export const load: PageServerLoad = ({ url }) => {
	const directory = listCompensationCompanies(listSources());
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
	const requestedCoverage = url.searchParams.get('coverage');
	const coverage = requestedCoverage === 'connected' || requestedCoverage === 'links'
		? requestedCoverage
		: 'all';
	const terms = query.toLocaleLowerCase('en-US').split(/\s+/).filter(Boolean);
	const filtered = directory.companies.filter((company) => {
		if (coverage === 'connected' && !company.source) return false;
		if (coverage === 'links' && company.source) return false;
		const searchable = [company.name, company.role, company.level, company.location]
			.filter(Boolean)
			.join(' ')
			.toLocaleLowerCase('en-US');
		return terms.every((term) => searchable.includes(term));
	});
	const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const requestedPage = Number(url.searchParams.get('page') ?? 1);
	const page = Number.isFinite(requestedPage)
		? Math.max(1, Math.min(pages, Math.floor(requestedPage)))
		: 1;
	const start = (page - 1) * PAGE_SIZE;

	return {
		checkedAt: directory.checkedAt,
		discoveredCompanies: directory.discoveredCompanies,
		checkedCompanies: directory.checkedCompanies,
		failedCompanies: directory.failedCompanies,
		eligibleCompanies: directory.companies.length,
		connectedCompanies: directory.companies.filter((company) => company.source !== null).length,
		companies: filtered.slice(start, start + PAGE_SIZE),
		query,
		coverage,
		page,
		pages,
		filteredCompanies: filtered.length,
		firstResult: filtered.length === 0 ? 0 : start + 1,
		lastResult: Math.min(start + PAGE_SIZE, filtered.length)
	};
};
