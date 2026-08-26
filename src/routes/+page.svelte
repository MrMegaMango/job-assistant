<script lang="ts">
	let { data, form } = $props();

	function money(min: number, max: number, currency: string): string {
		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			maximumFractionDigits: 0
		});
		return `${formatter.format(min)}–${formatter.format(max)}`;
	}
</script>

<section class="hero">
	<div>
		<p class="eyebrow">Daily briefing</p>
		<h1>Your strongest job matches, with receipts.</h1>
		<p class="lede">
			Every score is traceable to the title, skills, location, and published pay. Missing facts stay
			unknown instead of becoming confident guesses.
		</p>
	</div>
	<form method="POST" action="?/sync">
		<button type="submit">Sync jobs</button>
	</form>
</section>

{#if !data.profileComplete}
	<div class="notice">
		Your matching preferences are ready, but application contact details and resume path still need
		confirmation. <a href="/setup">Finish setup</a> before preparing an application.
	</div>
{/if}

{#if form?.message}
	<div class="notice good">{form.message}</div>
{/if}

{#if form?.syncResults}
	<div class="notice good">
		<strong>Sync finished.</strong>
		{form.syncResults.map((result: { source: string; count: number; error: string | null }) =>
			`${result.source}: ${result.error ? `error — ${result.error}` : `${result.count} jobs`}`).join(' · ')}
	</div>
{/if}

<section class="toolbar" aria-label="Match filters">
	<form method="GET">
		<label>
			Minimum match
			<input name="minimumScore" type="number" min="0" max="95" value={data.minimumScore} />
		</label>
		<button class="secondary" type="submit">Filter</button>
	</form>
	<span class="hint">Showing {data.jobs.length} ranked jobs</span>
</section>

{#if data.jobs.length === 0}
	<section class="panel empty">
		<h2>No matches loaded yet</h2>
		<p>Sync the enabled public ATS sources, or lower the minimum score.</p>
	</section>
{:else}
	<section class="grid" aria-label="Ranked jobs">
		{#each data.jobs as job}
			<article class="card">
				<div class="card-top">
					<div>
						<p class="eyebrow">{job.company}</p>
						<h2><a href={`/jobs/${job.id}`}>{job.title}</a></h2>
						<div class="meta">
							<span>{job.location || 'Location not listed'}</span>
							<span>{job.sourceProvider}</span>
							{#if job.remote}<span class="badge good">Remote</span>{/if}
						</div>
					</div>
					<div class="score" aria-label={`${job.match.score} percent match`}>{job.match.score}</div>
				</div>

				{#if job.salary}
					<p class="salary">{money(job.salary.min, job.salary.max, job.salary.currency)} / year · posted</p>
				{:else}
					<p class="salary">Pay not disclosed</p>
				{/if}

				<p class="excerpt">{job.excerpt}</p>
				<div class="meta">
					<span>Confidence {job.match.confidence}%</span>
					{#if job.match.matchedSkills.length}
						<span>{job.match.matchedSkills.slice(0, 4).join(' · ')}</span>
					{/if}
				</div>

				<div class="row-between" style="margin-top: 1rem">
					<a class="button secondary" href={`/jobs/${job.id}`}>Why it matches</a>
					{#if data.hostedDemo}
						<span class="badge warn">Demo preview</span>
					{:else if job.applicationState}
						<span class="badge good">{job.applicationState.replaceAll('_', ' ')}</span>
					{:else}
						<form method="POST" action="?/shortlist">
							<input type="hidden" name="jobId" value={job.id} />
							<button type="submit">Shortlist</button>
						</form>
					{/if}
				</div>
			</article>
		{/each}
	</section>
{/if}
