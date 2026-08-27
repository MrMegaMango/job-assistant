<script lang="ts">
	type SyncResult = { source: string; count: number; error: string | null };

	let { results }: { results: SyncResult[] } = $props();
	let failures = $derived(results.filter((result) => result.error));
	let successfulSources = $derived(results.length - failures.length);
	let jobCount = $derived(results.reduce((total, result) => total + result.count, 0));
</script>

<div
	class="notice"
	class:good={failures.length === 0}
	class:bad={failures.length > 0}
	role="status"
	aria-live="polite"
>
	<strong>{failures.length ? 'Sync completed with issues.' : 'Sync complete.'}</strong>
	<p>
		{jobCount.toLocaleString()} jobs refreshed across {successfulSources} of {results.length}
		{results.length === 1 ? 'source' : 'sources'}.
	</p>
	{#if failures.length}
		<ul class="clean">
			{#each failures as failure}
				<li><strong>{failure.source}:</strong> {failure.error}</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	p {
		margin: 0.35rem 0 0;
	}

	ul {
		margin-top: 0.65rem;
	}
</style>
