<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		label = 'Sync jobs',
		busyLabel = 'Syncing public sources…'
	}: { label?: string; busyLabel?: string } = $props();
	let syncing = $state(false);
</script>

<form
	method="POST"
	action="?/sync"
	use:enhance={() => {
		syncing = true;
		return async ({ update }) => {
			try {
				await update({ reset: false });
			} finally {
				syncing = false;
			}
		};
	}}
>
	<button type="submit" disabled={syncing} aria-busy={syncing}>
		{#if syncing}<span class="spinner" aria-hidden="true"></span>{/if}
		{syncing ? busyLabel : label}
	</button>
	<span class="sr-only" aria-live="polite">{syncing ? busyLabel : ''}</span>
</form>

<style>
	.spinner {
		width: 0.9rem;
		height: 0.9rem;
		border: 2px solid rgb(255 255 255 / 45%);
		border-top-color: currentcolor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
