<script lang="ts">
	import './layout.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<title>Job Assistant</title>
	<meta
		name="description"
		content="Private, explainable job discovery and application preparation."
	/>
</svelte:head>

<header class="site-header">
	<a class="brand" href="/" aria-label="Job Assistant home">
		<span class="brand-mark">JA</span>
		<span>
			<strong>Job Assistant</strong>
			<small>private career search</small>
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
		<strong>Disposable hosted demo.</strong> Job data may reset between requests. Profile editing and
		application tracking are disabled; clone the project to use those privately and durably.
	</div>
{/if}

<main>{@render children()}</main>

<footer>
	<span>{data.hostedDemo ? 'Hosted demo. Evidence over guesses.' : 'Local-first. Evidence over guesses.'}</span>
	<a href="/api/health">System status</a>
</footer>
