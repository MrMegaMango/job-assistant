<script lang="ts">
	let { data, form } = $props();
	const componentMaximums: Record<string, number> = {
		title: 25,
		skills: 30,
		domain: 15,
		seniority: 15,
		location: 10,
		compensation: 5
	};

	function money(min: number, max: number, currency: string): string {
		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			maximumFractionDigits: 0
		});
		return `${formatter.format(min)}–${formatter.format(max)}`;
	}
</script>

<svelte:head><title>{data.job.title} at {data.job.company} · High Match</title></svelte:head>

<section class="hero">
	<div>
		<p class="eyebrow">{data.job.company}</p>
		<h1>{data.job.title}</h1>
		<div class="meta">
			<span>{data.job.location || 'Location not listed'}</span>
			<span>{data.job.sourceProvider}</span>
			{#if data.job.remote}<span class="badge good">Remote</span>{/if}
			{#if data.application}<span class="badge good">{data.application.state.replaceAll('_', ' ')}</span>{/if}
		</div>
	</div>
	<div class="score" aria-label={`${data.job.match.score} percent match`}>{data.job.match.score}</div>
</section>

{#if data.prepared}<div class="notice good">Application packet refreshed from current verified facts.</div>{/if}
{#if data.submitted}<div class="notice good">Submission recorded in your local tracker.</div>{/if}
{#if form?.message}<div class="notice bad">{form.message}</div>{/if}

<div class="detail-grid" style="margin-top: 1rem">
	<div class="stack">
		<section class="panel">
			<div class="row-between">
				<div>
					<p class="eyebrow">Match explanation</p>
					<h2>{data.job.match.score}% match · {data.job.match.confidence}% confidence</h2>
				</div>
				<a href={data.job.canonicalUrl} target="_blank" rel="noreferrer">View original</a>
			</div>
			<div class="component-grid">
				{#each Object.entries(data.job.match.components) as [name, value]}
					<div class="component"><strong>{value}/{componentMaximums[name]}</strong><span>{name}</span></div>
				{/each}
			</div>
			<div class="form-grid" style="margin-top: 1rem">
				<div>
					<h3>Strengths</h3>
					<ul class="clean">{#each data.job.match.strengths as item}<li>{item}</li>{/each}</ul>
				</div>
				<div>
					<h3>Gaps and unknowns</h3>
					<ul class="clean">
						{#each [...data.job.match.gaps, ...data.job.match.unknowns] as item}<li>{item}</li>{/each}
					</ul>
				</div>
			</div>
		</section>

		<section class="panel">
			<p class="eyebrow">Job description</p>
			<h2>Employer text</h2>
			<p class="hint">Treated as untrusted text; never executed or allowed to direct tools.</p>
			<div class="prose">{data.job.description}</div>
		</section>
	</div>

	<aside class="stack sticky">
		<section class="panel">
			<p class="eyebrow">Compensation</p>
			{#if data.job.salary}
				<h2>{money(data.job.salary.min, data.job.salary.max, data.job.salary.currency)}</h2>
				<p>Employer-posted annual range.</p>
				<a href={data.job.salary.sourceUrl} target="_blank" rel="noreferrer">Pay source</a>
			{:else if data.benchmark}
				<h2>{money(data.benchmark.min, data.benchmark.max, data.benchmark.currency)}</h2>
				<p class="hint">{data.benchmark.label}</p>
				<a href={data.benchmark.sourceUrl} target="_blank" rel="noreferrer">BLS evidence</a>
			{:else}
				<h2>Not disclosed</h2>
				<p class="hint">No defensible benchmark was selected for this title.</p>
			{/if}
		</section>

		<section class="panel stack">
			<p class="eyebrow">Application</p>
			{#if data.hostedDemo}
				<p>Application packets are disabled in the disposable demo.</p>
				<a class="button" href={data.job.applyUrl} target="_blank" rel="noreferrer">Open employer form</a>
			{:else if !data.application}
				<p>Shortlist this job before creating an application packet.</p>
				<form method="POST" action="?/shortlist"><button type="submit">Shortlist</button></form>
			{:else}
				<span class="badge good">{data.application.state.replaceAll('_', ' ')}</span>
				{#if data.application.packet}
					<h3>Draft note</h3>
					<p>{data.application.packet.draftNote}</p>
					<h3>Required review</h3>
					<ul class="clean">
						{#each data.application.packet.checklist as item}<li>{item}</li>{/each}
					</ul>
				{/if}

				{#if data.application.state === 'SHORTLISTED' || data.application.state === 'NEEDS_INPUT' || data.application.state === 'READY_FOR_REVIEW'}
					<form method="POST" action="?/prepare"><button class="secondary" type="submit">Prepare again</button></form>
				{/if}
				{#if data.application.state === 'NEEDS_INPUT'}
					<a class="button secondary" href="/setup">Resolve setup checklist</a>
				{/if}
				{#if data.application.state === 'READY_FOR_REVIEW'}
					<form method="POST" action="?/approve">
						<button type="submit">Approve & open employer form</button>
					</form>
					<p class="hint">This records a one-use approval and opens the canonical form. You still review and submit it.</p>
				{/if}
				{#if data.application.state === 'OPENED'}
					<form method="POST" action="?/confirm" class="stack">
						<label>
							Confirmation ID or note
							<input name="confirmationId" placeholder="Optional" />
						</label>
						<button type="submit">I submitted it</button>
					</form>
				{/if}
			{/if}
		</section>
	</aside>
</div>
