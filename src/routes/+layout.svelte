<script lang="ts">
	import './layout.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<title>High Match Job Assistant</title>
	<meta
		name="description"
		content="Private, explainable job discovery and application preparation."
	/>
</svelte:head>

<header class="site-header">
	<a class="brand" href="/" aria-label="High Match Job Assistant home">
		<span class="brand-mark">HM</span>
		<span>
			<strong>High Match</strong>
			<small>private job assistant</small>
		</span>
	</a>
	<nav aria-label="Primary navigation">
		<a href="/">Matches</a>
		<a href="/applications">Applications <span class="count">{data.applicationCount}</span></a>
		<a href="/sources">Sources <span class="count">{data.enabledSourceCount}</span></a>
		<a href="/setup" class:attention={!data.profileReady}>Setup</a>
	</nav>
</header>

{#if data.hostedDemo}
	<div class="demo-banner">
		<strong>Read-only hosted preview.</strong> Matches use a verified Staff AI/backend infrastructure profile.
		Job data may reset; identity, resume, and application tracking stay local-only.
	</div>
{/if}

<main>{@render children()}</main>

<footer>
	<span>{data.hostedDemo ? 'Hosted preview. Evidence over guesses.' : 'Local-first. Evidence over guesses.'}</span>
	<a href="/api/health">System status</a>
</footer>
