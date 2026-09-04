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
		<div>
			<strong>Anonymous hosted preview.</strong>
			Matches use the {data.activeDemoProfile?.headline ?? 'selected professional profile'}.
			Identity, resumes, and applications stay local-only.
		</div>
		<form method="POST" action="/api/demo-profile" class="demo-profile-switcher">
			<input type="hidden" name="returnTo" value={data.returnTo} />
			<label>
				Match profile
				<select name="profileId" value={data.activeDemoProfile?.id}>
					{#each data.demoProfiles as profile}
						<option value={profile.id}>{profile.label}</option>
					{/each}
				</select>
			</label>
			<button class="secondary" type="submit">Switch</button>
		</form>
	</div>
{/if}

<main>{@render children()}</main>

<footer>
	<span>{data.hostedDemo ? 'Hosted preview. Evidence over guesses.' : 'Local-first. Evidence over guesses.'}</span>
	<a href="/api/health">System status</a>
</footer>
