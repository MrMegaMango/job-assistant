<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { FundingLead } from '$lib/discovery-types';

	let { data, form } = $props();
	let searching = $state(false);
	let transportError = $state('');
	let onlyNew = $state(false);
	let fundingFirst = $state(false);
	const result = $derived(transportError || form?.error ? undefined : form?.result);
	const jobs = $derived(
		(result?.jobs ?? [])
			.filter((job) => !onlyNew || !job.knownCompany)
			.toSorted((a, b) =>
				(fundingFirst ? Number(b.funding.length > 0) - Number(a.funding.length > 0) : 0) ||
				b.match.score - a.match.score
			)
	);
	const funding = $derived(
		(result?.funding ?? []).filter((lead) => !onlyNew || (lead.company !== null && !lead.knownCompany))
	);
	const newCompanyCount = $derived(new Set(
		(result?.jobs ?? []).filter((job) => !job.knownCompany).map((job) => job.company.toLowerCase())
	).size);

	const dayFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles'
	});
	const timeFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
		timeZone: 'America/Los_Angeles', timeZoneName: 'short'
	});

	function dateLabel(value: string | null, includeTime = false): string {
		if (!value) return 'Date not listed';
		const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-07:00` : value);
		return Number.isNaN(date.getTime()) ? 'Date not listed' : (includeTime ? timeFormatter : dayFormatter).format(date);
	}

	function hiringLabel(lead: FundingLead): string {
		if (lead.hiringStatus === 'indexed_openings') {
			return `${lead.jobCount} indexed ${lead.jobCount === 1 ? 'opening' : 'openings'}`;
		}
		if (lead.hiringStatus === 'not_found') return 'No openings found in this search';
		if (lead.hiringStatus === 'unavailable') return 'Hiring check unavailable';
		if (lead.hiringStatus === 'ambiguous') return 'Company identity needs confirmation';
		return 'Hiring not yet checked';
	}

	const search: SubmitFunction = () => {
		searching = true;
		transportError = '';
		return async ({ result: response, update }) => {
			try {
				if (response.type === 'error') {
					transportError = 'The search could not finish. Check your connection and try again.';
				} else {
					await update({ reset: false, invalidateAll: false });
				}
			} finally {
				searching = false;
			}
		};
	};
</script>

<svelte:head>
	<title>Discover Companies · High Match</title>
	<meta name="description" content="Supplement your company list with live job discovery and recent funding reports." />
</svelte:head>

<section class="hero discover-hero">
	<div>
		<p class="eyebrow">Live discovery</p>
		<h1>Search beyond your company list.</h1>
		<p class="lede">Keep the companies you follow. Find new employers with relevant openings, and investigate the ones making fresh funding announcements.</p>
	</div>
	<a class="button secondary directory-link" href="/companies">Browse my company list <span aria-hidden="true">↗</span></a>
</section>

<section class="panel search-panel" aria-labelledby="search-heading">
	<div class="search-heading">
		<div>
			<h2 id="search-heading">Search remote openings and funding news</h2>
			<p class="hint">Fit uses {data.activeAccountProfile?.name ?? data.activeDemoProfile?.label ?? 'your matching profile'}. Search terms are editable.</p>
		</div>
		<span class="badge">On demand</span>
	</div>
	<form method="POST" action="?/search" use:enhance={search} aria-busy={searching}>
		<div class="search-fields">
			<label class="query-field">Role or topic
				<input name="query" type="search" value={form?.values?.query ?? data.defaults.query} minlength="2" maxlength="120" placeholder="e.g. platform engineer or AI infrastructure" required disabled={searching} />
			</label>
			<label>Country
				<input name="country" value={form?.values?.country ?? data.defaults.country} maxlength="80" placeholder="e.g. United States" disabled={searching} />
			</label>
			<label>Funding news
				<select name="fundingDays" value={form?.values?.fundingDays ?? 90} disabled={searching}>
					<option value={30}>Last 30 days</option>
					<option value={90}>Last 90 days</option>
				</select>
			</label>
		</div>
		<div class="search-footer">
			<p class="hint">Search public job indexes and funding reports. Your company list stays available for ongoing coverage.</p>
			<button type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search beyond my list'} <span aria-hidden="true">→</span></button>
		</div>
	</form>
</section>

{#if searching}
	<div class="notice search-progress" role="status"><span class="pulse" aria-hidden="true"></span>Searching current openings and recent funding reports…</div>
{/if}
{#if transportError || form?.error}
	<div class="notice error-notice" role="alert">{transportError || form?.error}</div>
{/if}

{#if result}
	<section class="search-results" aria-label="Discovery results" aria-busy={searching}>
		<div class="results-summary">
			<div>
				<p class="eyebrow">Your search</p>
				<h2>{result.query}</h2>
				<p class="hint">{result.country || 'All countries'} · Checked {dateLabel(result.searchedAt, true)}</p>
			</div>
			<div class="result-counts" aria-label="Search totals">
				<div><strong>{result.jobs.length}</strong><span>indexed roles</span></div>
				<div><strong>{newCompanyCount}</strong><span>new employers with roles</span></div>
				<div><strong>{result.funding.length}</strong><span>funding reports</span></div>
			</div>
		</div>

		{#if result.warnings.length > 0}
			<div class="notice coverage-warning" role="status">
				<strong>Some coverage needs attention</strong>
				<ul>{#each result.warnings as warning}<li>{warning}</li>{/each}</ul>
				<p>Missing results here do not establish that a company is not hiring.</p>
			</div>
		{/if}

		<div class="result-controls">
			<label class="check-label"><input type="checkbox" bind:checked={onlyNew} /> Only companies outside my list</label>
			<label class="check-label"><input type="checkbox" bind:checked={fundingFirst} /> Show roles with funding news first</label>
		</div>
		<div class="section-links" aria-label="Jump to discovery results">
			<a href="#roles-heading">Remote openings</a>
			<a href="#funding-heading">Funding reports <span aria-hidden="true">↓</span></a>
		</div>

		<div class="discovery-columns">
			<section aria-labelledby="roles-heading" class="roles-section">
				<div class="section-heading"><h2 id="roles-heading">Remote openings to explore</h2><span class="badge">{jobs.length}</span></div>
				<p class="section-note hint">Job indexes provide these listings. Confirm availability, requirements, and pay on the employer’s site.</p>
				{#if jobs.length === 0}
					<div class="panel empty compact-empty">
						<h3>{onlyNew ? 'No roles outside your list in these results' : 'No roles returned by this search'}</h3>
						<p>{onlyNew ? 'Turn off the filter to see every discovered employer.' : result.warnings.length > 0 ? 'Review the coverage notes, then retry or try a broader role.' : 'Try a broader role or topic. This search does not cover every employer.'}</p>
					</div>
				{:else}
					<div class="job-list">
						{#each jobs as job (job.id)}
							<article class="card discovery-job">
								<div class="job-heading">
									<div><p class="eyebrow">{job.company}</p><h3><a href={job.employerUrl ?? job.listingUrl} target="_blank" rel="noreferrer">{job.title}</a></h3></div>
									<div class="fit-score"><strong>{job.match.score}</strong><span>role fit / 100</span></div>
								</div>
								<div class="meta"><span>{job.location || 'Location not listed'}</span>{#if job.remote}<span class="badge good">Remote</span>{/if}</div>
								<div class="signal-tags">
									<span class="badge" class:good={!job.knownCompany}>{job.knownCompany ? 'In your company list' : 'Outside your list'}</span>
									{#if job.funding.length > 0}<span class="badge warn">Funding news</span>{/if}
									{#if job.match.hardRejected}<span class="badge warn">Conflicts with your criteria</span>{/if}
								</div>
								{#if job.listedSalary}<p class="listed-pay">{job.listedSalary} <span>· pay shown by index</span></p>{/if}
								<p class="job-excerpt">{job.excerpt}</p>
								<details class="match-evidence">
									<summary>Why this fit score?</summary>
									<div class="evidence-body">
										<p class="hint">Scored from the indexed description. Funding does not change the fit score.</p>
										{#if job.match.strengths.length > 0}<h4>Evidence</h4><ul>{#each job.match.strengths as strength}<li>{strength}</li>{/each}</ul>{/if}
										{#if job.match.gaps.length > 0}<h4>Gaps</h4><ul>{#each job.match.gaps as gap}<li>{gap}</li>{/each}</ul>{/if}
										{#if job.match.unknowns.length > 0}<h4>Unknowns</h4><ul>{#each job.match.unknowns as unknown}<li>{unknown}</li>{/each}</ul>{/if}
									</div>
								</details>
								{#if job.funding.length > 0}
									<div class="related-funding"><span class="hint">Funding report · company name match</span><a href={job.funding[0].url} target="_blank" rel="noreferrer">{job.funding[0].title}</a></div>
								{/if}
								<div class="job-actions">
									<a class="button secondary" href={job.employerUrl ?? job.listingUrl} target="_blank" rel="noreferrer">{job.employerUrl ? 'Check employer posting' : 'Review indexed listing'}<span class="sr-only"> for {job.title} at {job.company} (opens in a new tab)</span></a>
									<a class="source-link" href={job.listingUrl} target="_blank" rel="noreferrer">{job.source}</a>
									{#if job.companyWebsite}<a class="source-link" href={job.companyWebsite} target="_blank" rel="noreferrer">Employer website</a>{/if}
								</div>
								<p class="posted-date hint">{job.postedAt ? `Listed ${dateLabel(job.postedAt)}` : 'Posting date not provided'}</p>
							</article>
						{/each}
					</div>
				{/if}
			</section>

			<section aria-labelledby="funding-heading" class="funding-section">
				<div class="section-heading"><h2 id="funding-heading">Funding reports</h2><span class="badge">{funding.length}</span></div>
				<p class="section-note hint">Recent publisher reports from the last {result.fundingDays} days, independent of your role search. Publication dates are not round closing dates; funding alone does not establish hiring. Hiring counts may include other locations and roles.</p>
				{#if funding.length === 0}
					<div class="panel empty compact-empty"><h3>No funding reports to show</h3><p>{onlyNew ? 'Turn off the company filter to see all funding reports.' : result.warnings.length > 0 ? 'Review the coverage notes. A source may be unavailable.' : 'Try the 90-day window or check again later. Unreported rounds may be missing.'}</p></div>
				{:else}
					<div class="funding-list">
						{#each funding as lead (lead.id)}
							<article class="panel funding-card">
								<div class="funding-meta"><p class="eyebrow">{lead.company ?? 'Company to verify'}</p>{#if lead.company && !lead.knownCompany}<span class="badge good">Outside your list</span>{/if}</div>
								<h3><a href={lead.url} target="_blank" rel="noreferrer">{lead.title}</a></h3>
								<p class="report-source">{lead.publisher} · Published {dateLabel(lead.publishedAt)}</p>
								<p class="hiring-label" class:has-openings={lead.hiringStatus === 'indexed_openings'}><span aria-hidden="true">{lead.hiringStatus === 'indexed_openings' ? '↗' : '○'}</span> {hiringLabel(lead)}</p>
								{#if lead.company}
									<form method="POST" action="?/search" use:enhance={search} class="funding-search" aria-busy={searching}>
										<input type="hidden" name="query" value={lead.company} />
										<input type="hidden" name="country" value={result.country} />
										<input type="hidden" name="fundingDays" value={result.fundingDays} />
										<button type="submit" class="secondary" disabled={searching}>Check openings<span class="sr-only"> at {lead.company}</span><span aria-hidden="true">→</span></button>
									</form>
								{/if}
							</article>
						{/each}
					</div>
				{/if}
			</section>
		</div>
		<details class="coverage-details"><summary>What this search covers</summary><ul>{#each result.coverage as item}<li>{item}</li>{/each}</ul><p>Dates are shown in Pacific Time. Searches can miss companies and openings; keep your company list as a second path.</p></details>
	</section>
{:else}
	<div class="discovery-intro">
		<div><span class="intro-number" aria-hidden="true">01</span><h2>Keep reliable coverage</h2><p>Your existing company directory and connected feeds keep tracking familiar employers.</p></div>
		<div><span class="intro-number" aria-hidden="true">02</span><h2>Make room for new names</h2><p>Search across job indexes for companies that have never appeared in your list.</p></div>
		<div><span class="intro-number" aria-hidden="true">03</span><h2>Follow the funding trail</h2><p>Use cited funding reports as leads, then check for relevant openings and employer confirmation.</p></div>
	</div>
{/if}

<style>
	.discover-hero { align-items: end; gap: 1.5rem; }
	.discover-hero h1 { max-width: 19ch; }
	.discover-hero .lede { max-width: 47rem; }
	.directory-link { white-space: nowrap; margin-bottom: 0.35rem; }
	.search-panel { margin-top: 1.8rem; padding: clamp(1rem, 2.4vw, 1.75rem); }
	.search-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
	.search-heading h2 { margin-bottom: 0.35rem; font-size: 1.2rem; }
	.search-heading p { margin: 0; font-size: 0.86rem; line-height: 1.45; }
	.search-heading > .badge { flex-shrink: 0; }
	.search-fields { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr); gap: 1rem; }
	.search-fields label { min-width: 0; font-size: 0.86rem; }
	.search-fields input, .search-fields select { min-height: 3rem; }
	.search-footer { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; margin-top: 1.2rem; }
	.search-footer p { max-width: 38rem; margin: 0; font-size: 0.82rem; line-height: 1.5; }
	.search-footer button { flex-shrink: 0; }
	.search-progress { display: flex; align-items: center; gap: 0.65rem; }
	.pulse { width: 0.65rem; height: 0.65rem; flex-shrink: 0; border-radius: 50%; background: var(--green); animation: pulse 1s ease-in-out infinite alternate; }
	@keyframes pulse { to { opacity: 0.35; } }
	.error-notice { border-color: #d99d97; background: var(--red-soft); color: var(--red); }
	.results-summary { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; margin: 2.3rem 0 1.3rem; }
	.results-summary h2 { margin-bottom: 0.35rem; font-size: 1.55rem; overflow-wrap: anywhere; }
	.results-summary p { margin-bottom: 0; font-size: 0.85rem; }
	.result-counts { display: flex; flex-wrap: wrap; gap: 1.5rem; }
	.result-counts div { display: grid; gap: 0.25rem; }
	.result-counts strong { color: var(--green); font-size: 1.9rem; font-weight: 800; letter-spacing: -0.04em; }
	.result-counts span { font-size: 0.75rem; color: var(--muted); }
	.coverage-warning { line-height: 1.5; }
	.coverage-warning ul { margin: 0.5rem 0; padding-left: 1.1rem; }
	.coverage-warning p { margin: 0; font-size: 0.85rem; }
	.result-controls { display: flex; flex-wrap: wrap; gap: 0.8rem 1.5rem; padding: 1rem 0; margin-bottom: 1rem; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
	.check-label { display: flex; align-items: center; gap: 0.55rem; font-size: 0.83rem; font-weight: 600; cursor: pointer; }
	.check-label input { width: 1rem; height: 1rem; padding: 0; flex-shrink: 0; accent-color: var(--green); }
	.section-links { display: flex; flex-wrap: wrap; gap: 0.6rem 1.25rem; margin: 0 0 1.4rem; font-size: 0.8rem; }
	.discovery-columns { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); gap: 1.5rem; }
	.roles-section, .funding-section { min-width: 0; }
	.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
	.section-heading h2 { font-size: 1.2rem; margin: 0; }
	.section-heading h2 { scroll-margin-top: 10rem; }
	.section-note { font-size: 0.83rem; line-height: 1.55; margin: 0.65rem 0 1rem; min-height: 3.9em; }
	.job-list, .funding-list { display: grid; gap: 1rem; }
	.discovery-job { min-width: 0; }
	.job-heading { display: flex; justify-content: space-between; align-items: start; gap: 1rem; }
	.job-heading > div:first-child { min-width: 0; }
	.job-heading h3 { font-size: 1.18rem; line-height: 1.3; margin-bottom: 0.6rem; overflow-wrap: anywhere; }
	.job-heading h3 a { color: var(--ink); text-decoration: none; }
	.job-heading h3 a:hover { text-decoration: underline; }
	.job-heading .eyebrow, .funding-meta .eyebrow { overflow-wrap: anywhere; }
	.fit-score { display: grid; justify-items: center; flex-shrink: 0; padding: 0.55rem 0.65rem; border-radius: 0.6rem; color: var(--green); background: var(--green-soft); }
	.fit-score strong { font-size: 1.7rem; line-height: 1; letter-spacing: -0.045em; }
	.fit-score span { margin-top: 0.3rem; font-size: 0.62rem; white-space: nowrap; }
	.discovery-job .meta { font-size: 0.82rem; line-height: 1.5; }
	.signal-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.9rem 0; }
	.listed-pay { font-size: 0.94rem; font-weight: 700; color: var(--green); line-height: 1.5; }
	.listed-pay span { color: var(--muted); font-size: 0.75rem; font-weight: 400; }
	.job-excerpt { font-size: 0.88rem; line-height: 1.6; overflow-wrap: anywhere; }
	.match-evidence { font-size: 0.83rem; line-height: 1.5; }
	.match-evidence summary { color: var(--green); font-weight: 650; cursor: pointer; }
	.evidence-body { padding-top: 0.8rem; }
	.evidence-body h4 { margin: 0.65rem 0 0.3rem; }
	.evidence-body ul { padding-left: 1.1rem; margin: 0 0 0.75rem; }
	.related-funding { display: grid; gap: 0.3rem; margin-top: 1rem; padding-left: 0.75rem; border-left: 2px solid #e4b970; font-size: 0.79rem; line-height: 1.45; }
	.job-actions { display: flex; flex-wrap: wrap; gap: 0.75rem 1rem; align-items: center; margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid var(--line); }
	.job-actions .button { font-size: 0.82rem; }
	.source-link { font-size: 0.8rem; }
	.posted-date { font-size: 0.72rem; margin: 0.8rem 0 0; }
	.funding-card { min-width: 0; border-top: 3px solid #dcb66e; }
	.funding-meta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: start; gap: 0.5rem; margin-bottom: 0.8rem; }
	.funding-meta .eyebrow { margin: 0; }
	.funding-card h3 { margin-bottom: 0.75rem; font-size: 1rem; line-height: 1.5; overflow-wrap: anywhere; }
	.funding-card h3 a { color: var(--ink); text-decoration: none; }
	.funding-card h3 a:hover { text-decoration: underline; }
	.report-source { font-size: 0.75rem; line-height: 1.5; color: var(--muted); }
	.hiring-label { display: flex; align-items: baseline; gap: 0.35rem; margin: 0.9rem 0 0; font-size: 0.78rem; color: var(--muted); }
	.has-openings { color: var(--green); font-weight: 650; }
	.funding-search { margin-top: 1rem; }
	.funding-search button { min-height: 2.3rem; padding: 0.45rem 0.75rem; font-size: 0.78rem; }
	.compact-empty { padding: 1.4rem 1rem; }
	.compact-empty h3 { font-size: 1rem; }
	.compact-empty p { font-size: 0.85rem; line-height: 1.6; margin-bottom: 0; }
	.coverage-details { margin-top: 1.7rem; padding-top: 1.2rem; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.8rem; line-height: 1.55; }
	.coverage-details summary { cursor: pointer; font-weight: 600; color: var(--ink); }
	.coverage-details ul { padding-left: 1.1rem; }
	.discovery-intro { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2rem; margin-top: 2.4rem; padding: 0 0.3rem; }
	.intro-number { display: block; margin-bottom: 0.8rem; color: var(--green); font-size: 0.8rem; font-weight: 750; letter-spacing: 0.12em; }
	.discovery-intro h2 { font-size: 1.05rem; margin-bottom: 0.55rem; }
	.discovery-intro p { color: var(--muted); font-size: 0.87rem; line-height: 1.65; }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
	@media (max-width: 900px) {
		.discover-hero { grid-template-columns: 1fr; }
		.directory-link { justify-self: start; }
		.discovery-columns { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 1rem; }
		.search-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.query-field { grid-column: 1 / -1; }
	}
	@media (max-width: 650px) {
		.search-heading { gap: 0.6rem; }
		.search-heading h2 { font-size: 1.1rem; }
		.search-fields { gap: 0.8rem; }
		.search-footer { align-items: stretch; flex-direction: column; gap: 1rem; }
		.result-counts { width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; }
		.result-counts span { line-height: 1.4; }
		.result-controls { flex-direction: column; gap: 0.9rem; }
		.discovery-columns { grid-template-columns: 1fr; gap: 2rem; }
		.section-note { min-height: 0; }
		.discovery-intro { grid-template-columns: 1fr; gap: 0.8rem; margin-top: 1.8rem; }
		.discovery-intro > div { padding-left: 2.7rem; position: relative; }
		.intro-number { position: absolute; top: 0.2rem; left: 0; }
		.discover-hero h1 { max-width: none; }
	}
	@media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
