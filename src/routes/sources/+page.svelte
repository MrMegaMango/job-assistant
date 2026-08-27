<script lang="ts">
	import SyncControl from '$lib/components/SyncControl.svelte';
	import SyncResults from '$lib/components/SyncResults.svelte';

	let { data, form } = $props();
</script>

<section class="hero">
	<div>
		<p class="eyebrow">Sources</p>
		<h1>Employer-origin jobs, not scraped feeds.</h1>
		<p class="lede">
			The MVP reads public company board APIs from Greenhouse, Ashby, and Lever. Each record keeps its
			canonical source and application URL.
		</p>
	</div>
	<SyncControl label="Sync enabled" busyLabel="Checking enabled sources…" />
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
					<span>{source.provider}</span>
					<span>board: {source.boardToken}</span>
				</div>
				<h2 style="margin: 0.45rem 0">{source.name}</h2>
				{#if source.lastSyncedAt}<p class="hint">Last synced {new Date(source.lastSyncedAt).toLocaleString()}</p>{/if}
				{#if source.lastError}<p class="notice bad">{source.lastError}</p>{/if}
				<a href={source.policyUrl} target="_blank" rel="noreferrer">Official API policy</a>
			</div>
			{#if data.hostedDemo}
				<span class="badge warn">Fixed in demo</span>
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
	<p class="hint">Use the board slug from the company's public Greenhouse, Ashby, or Lever URL.</p>
	<div class="form-grid">
		<label>
			Provider
			<select name="provider">
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
			Board token
			<input name="boardToken" required placeholder="company-slug" />
		</label>
	</div>
	<button type="submit">Add source</button>
</form>{/if}
