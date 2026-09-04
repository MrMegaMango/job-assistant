<script lang="ts">
	import SyncControl from '$lib/components/SyncControl.svelte';
	import SyncResults from '$lib/components/SyncResults.svelte';
	import LeadershipSurnameNote from '$lib/components/LeadershipSurnameNote.svelte';

	let { data, form } = $props();
</script>

<section class="hero">
	<div>
		<p class="eyebrow">Sources</p>
		<h1>Public job sources with clear provenance.</h1>
		<p class="lede">
			{data.sources.length} validated sources are ready across Greenhouse, Ashby, Lever, and We Work
			Remotely’s public RSS feed. Each record keeps its source and application URL.
		</p>
	</div>
	<SyncControl label="Sync enabled" busyLabel="Checking enabled sources…" />
</section>

<section class="panel" style="margin-top: 1rem">
	<h2>Manual flexible-work discovery</h2>
	<p>
		FlexJobs does not provide a public read feed, so it is linked rather than scraped. Treat listings as
		discovery leads and verify the role on the employer’s own site.
	</p>
	<a
		href="https://www.flexjobs.com/remote-jobs/part-time/software-engineering"
		target="_blank"
		rel="noreferrer">Browse part-time software-engineering roles on FlexJobs</a
	>
</section>

{#if form?.message}<div class="notice good">{form.message}</div>{/if}
{#if form?.syncResults}
	<SyncResults results={form.syncResults} />
{/if}

<section class="stack" style="margin-top: 1rem">
	{#each data.sources as source}
		<article class="panel source-row">
			<div>
				<div class="meta">
					<span class:good={source.enabled} class="badge">{source.enabled ? 'Enabled' : 'Paused'}</span>
					<span>{source.provider === 'wwr' ? 'We Work Remotely RSS' : source.provider}</span>
					<span>board: {source.boardToken}</span>
				</div>
				<h2 style="margin: 0.45rem 0">{source.name}</h2>
				{#if source.lastSyncedAt}<p class="hint">Last synced {new Date(source.lastSyncedAt).toLocaleString()}</p>{/if}
				{#if source.lastError}<p class="notice bad">{source.lastError}</p>{/if}
				<a href={source.policyUrl} target="_blank" rel="noreferrer">Official source details</a>
				{#if source.leadership}
					<LeadershipSurnameNote
						leadership={source.leadership}
						researchedAt={data.leadershipResearchedAt}
						context={data.surnameContext}
					/>
				{/if}
			</div>
			{#if data.hostedDemo}
				<span class="badge warn">Fixed in preview</span>
			{:else}<form method="POST" action="?/toggle">
				<input type="hidden" name="sourceId" value={source.id} />
				<input type="hidden" name="enabled" value={String(!source.enabled)} />
				<button class="secondary" type="submit">{source.enabled ? 'Pause' : 'Enable'}</button>
			</form>{/if}
		</article>
	{/each}
</section>

{#if !data.hostedDemo}<form method="POST" action="?/add" class="panel stack" style="margin-top: 1rem">
	<h2>Add a company board</h2>
	<p class="hint">Paste a public board URL for automatic detection, or choose a provider and enter its slug.</p>
	<div class="form-grid">
		<label>
			Provider
			<select name="provider">
				<option value="">Detect from URL</option>
				<option value="greenhouse">Greenhouse</option>
				<option value="ashby">Ashby</option>
				<option value="lever">Lever</option>
			</select>
		</label>
		<label>
			Company name
			<input name="name" required />
		</label>
		<label class="wide">
			Board slug or URL
			<input name="boardToken" required placeholder="https://jobs.ashbyhq.com/company" />
		</label>
	</div>
	<button type="submit">Add source</button>
</form>{/if}
