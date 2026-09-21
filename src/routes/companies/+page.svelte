<script lang="ts">
	let { data } = $props();

	const money = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'America/Los_Angeles'
	});

	function dateLabel(value: string): string {
		const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-07:00` : value);
		return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
	}

	function pageLink(page: number): string {
		const params = new URLSearchParams();
		if (data.query) params.set('q', data.query);
		if (data.coverage !== 'all') params.set('coverage', data.coverage);
		params.set('page', String(page));
		return `/companies?${params.toString()}`;
	}
</script>

<svelte:head>
	<title>$300K+ Companies · High Match</title>
	<meta
		name="description"
		content="Explore companies with reported annual total compensation of $300,000 or more on Levels.fyi, across all job families."
	/>
</svelte:head>

<section class="hero company-hero">
	<div>
		<p class="eyebrow">Company directory</p>
		<h1>$300K+ companies, across all job families.</h1>
		<p class="lede">
			Employers with a public Levels.fyi compensation figure of at least $300,000 across any
			job family. These annual total compensation estimates include salary, stock, and bonus.
		</p>
		<p class="hint scope-note">
			Reported compensation is historical, not an advertised job salary. Openings may be remote,
			hybrid, or on-site, and pay varies by role and location.
		</p>
	</div>
</section>

<dl class="directory-stats">
	<div class="panel">
		<dt>Companies researched</dt>
		<dd>{data.checkedCompanies.toLocaleString('en-US')} <span>of {data.discoveredCompanies.toLocaleString('en-US')}</span></dd>
	</div>
	<div class="panel">
		<dt>With $300K+ compensation</dt>
		<dd>{data.eligibleCompanies.toLocaleString('en-US')}</dd>
	</div>
	<div class="panel">
		<dt>Connected job feeds</dt>
		<dd>{data.connectedCompanies.toLocaleString('en-US')}</dd>
	</div>
</dl>

<p class="hint research-note">
	Checked {dateLabel(data.checkedAt)}.
	Connected feeds supply jobs for your matches. Other companies have links to explore openings.
</p>

{#if data.checkedCompanies < data.discoveredCompanies || data.failedCompanies > 0}
	<div class="notice">
		<strong>Coverage is still incomplete.</strong>
		This directory includes the qualifying companies verified so far.
		{#if data.failedCompanies > 0}
			Salary data could not be checked for {data.failedCompanies.toLocaleString('en-US')}
			{data.failedCompanies === 1 ? 'company' : 'companies'}.
		{/if}
	</div>
{/if}

<section class="toolbar company-toolbar" aria-label="Company filters">
	<form method="GET" action="/companies">
		<label class="search-field">
			Company, reported role, or location
			<input type="search" name="q" value={data.query} placeholder="e.g. Netflix or product manager" />
		</label>
		<label>
			Job coverage
			<select name="coverage" value={data.coverage}>
				<option value="all">All companies</option>
				<option value="connected">Connected feeds</option>
				<option value="links">Links to openings</option>
			</select>
		</label>
		<button type="submit">Search</button>
		{#if data.query || data.coverage !== 'all'}<a class="clear-filter" href="/companies">Clear filters</a>{/if}
	</form>
</section>

<div class="results-heading">
	<h2>{data.filteredCompanies.toLocaleString('en-US')} {data.filteredCompanies === 1 ? 'company' : 'companies'}</h2>
	{#if data.filteredCompanies > 0}
		<p class="hint">Showing {data.firstResult}–{data.lastResult}</p>
	{/if}
</div>

{#if data.companies.length === 0}
	<section class="panel empty">
		<h2>No companies match these filters</h2>
		<p>Try a company name or a broader job family.</p>
		<a class="button secondary" href="/companies">Show all companies</a>
	</section>
{:else}
	<section class="grid company-grid" aria-label="Companies with reported compensation of at least $300,000">
		{#each data.companies as company (company.slug)}
			<article class="card company-card">
				<div class="company-heading">
					<h2>{company.name}</h2>
					{#if company.source}
						<span class="badge" class:good={company.source.enabled && !company.source.lastError} class:warn={!company.source.enabled || Boolean(company.source.lastError)}>
							{company.source.lastError ? 'Feed needs attention' : company.source.enabled ? 'Connected feed' : 'Feed paused'}
						</span>
					{:else}
						<span class="badge">Links to openings</span>
					{/if}
				</div>
				<p class="reported-pay">{money.format(company.reportedAnnualUsd)} <span>/ year</span></p>
				<p class="hint pay-label">Example reported annual TC · USD estimate</p>
				<div class="report-context">
					<p class="report-role">{company.role}{#if company.level}<span> · {company.level}</span>{/if}</p>
					{#if company.location}<p class="hint">{company.location}</p>{/if}
					{#if company.sourceUpdatedAt}<p class="hint report-date">Source updated {dateLabel(company.sourceUpdatedAt)}</p>{/if}
				</div>
				<div class="company-actions">
					<a class="button secondary" href={company.jobsUrl} target="_blank" rel="noreferrer">Browse openings<span class="sr-only"> at {company.name} (opens in a new tab)</span></a>
					<a href={company.levelsUrl} target="_blank" rel="noreferrer">Salary evidence<span class="sr-only"> for {company.name} on Levels.fyi (opens in a new tab)</span></a>
				</div>
			</article>
		{/each}
	</section>
{/if}

{#if data.pages > 1}
	<nav class="pagination" aria-label="Company results pages">
		{#if data.page > 1}
			<a class="button secondary" href={pageLink(data.page - 1)}>← Previous</a>
		{:else}<span class="pagination-spacer"></span>{/if}
		<span class="hint">Page {data.page} of {data.pages}</span>
		{#if data.page < data.pages}
			<a class="button secondary" href={pageLink(data.page + 1)}>Next →</a>
		{:else}<span class="pagination-spacer"></span>{/if}
	</nav>
{/if}

<style>
	.company-hero { grid-template-columns: 1fr; }
	.scope-note { max-width: 52rem; margin-bottom: 0; line-height: 1.55; }
	.directory-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin: 1rem 0; }
	.directory-stats dt { color: var(--muted); font-size: 0.85rem; }
	.directory-stats dd { margin: 0.45rem 0 0; font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.035em; }
	.directory-stats dd span { color: var(--muted); font-size: 0.85rem; font-weight: 500; letter-spacing: 0; white-space: nowrap; }
	.research-note { font-size: 0.88rem; line-height: 1.5; }
	.company-toolbar form { width: 100%; }
	.search-field { flex: 1; min-width: min(100%, 16rem); }
	.clear-filter { align-self: center; font-size: 0.85rem; }
	.results-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin: 1.5rem 0 0.75rem; }
	.results-heading h2 { margin: 0; font-size: 1.25rem; }
	.results-heading p { margin: 0; font-size: 0.85rem; white-space: nowrap; }
	.company-card { display: flex; flex-direction: column; min-width: 0; }
	.company-heading { display: flex; flex-wrap: wrap; align-items: start; justify-content: space-between; gap: 0.7rem; }
	.company-heading h2 { font-size: 1.4rem; overflow-wrap: anywhere; }
	.company-heading .badge { flex-shrink: 0; }
	.reported-pay { margin: 1.25rem 0 0.25rem; color: var(--green); font-size: 1.75rem; font-weight: 850; letter-spacing: -0.04em; }
	.reported-pay span { color: var(--muted); font-size: 0.9rem; font-weight: 500; letter-spacing: 0; }
	.pay-label { margin: 0; font-size: 0.8rem; }
	.report-context { flex: 1; margin: 1rem 0 1.15rem; line-height: 1.45; }
	.report-context p { margin-bottom: 0.3rem; }
	.report-role { font-weight: 650; }
	.report-role span { font-weight: 400; }
	.report-date { font-size: 0.78rem; }
	.company-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.8rem 1rem; padding-top: 1rem; border-top: 1px solid var(--line); }
	.company-actions > a:not(.button) { font-size: 0.88rem; }
	.pagination { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; margin-top: 1.5rem; }
	.pagination > .hint { align-self: center; font-size: 0.85rem; }
	.pagination-spacer { width: 7.5rem; }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
	@media (max-width: 600px) {
		.directory-stats { gap: 0.5rem; }
		.directory-stats .panel { padding: 0.85rem 0.65rem; border-radius: 0.75rem; }
		.directory-stats dt { font-size: 0.73rem; min-height: 2rem; }
		.directory-stats dd span { display: block; margin-top: 0.1rem; font-size: 0.7rem; }
		.company-toolbar form { align-items: stretch; }
		.clear-filter { align-self: start; }
		.results-heading { gap: 0.6rem; }
		.results-heading h2 { font-size: 1.05rem; }
		.results-heading p { font-size: 0.75rem; }
		.pagination .button { padding: 0.55rem 0.6rem; font-size: 0.8rem; }
		.pagination-spacer { width: 5rem; }
	}
</style>
