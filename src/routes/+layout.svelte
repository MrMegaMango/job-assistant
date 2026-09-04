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
		{#if data.account?.signedIn}
			<div>
				<strong>{data.account.profileSaved ? 'Personalized profile.' : 'Google account connected.'}</strong>
				{data.account.profileSaved
					? 'Matches use your private saved preferences.'
					: 'Create your private matching profile to personalize scores.'}
				Identity, resumes, and applications stay local-only.
			</div>
			<div class="inline-actions">
				<a class="button secondary" href="/setup">{data.account.profileSaved ? 'Edit profile' : 'Create profile'}</a>
				<form method="POST" action="/auth/logout">
					<input type="hidden" name="returnTo" value={data.returnTo} />
					<button class="secondary" type="submit">Sign out</button>
				</form>
			</div>
		{:else}
			<div>
				<strong>Anonymous hosted preview.</strong>
				Matches use the {data.activeDemoProfile?.headline ?? 'selected professional profile'}.
				Sign in only if you want a profile saved across devices.
			</div>
			<div class="inline-actions">
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
				{#if data.account?.configured}
					<a class="button" href="/auth/login?returnTo=%2Fsetup">Continue with Google</a>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<main>{@render children()}</main>

<footer>
	<span>{data.hostedDemo ? 'Hosted preview. Evidence over guesses.' : 'Local-first. Evidence over guesses.'}</span>
	<div class="inline-actions">
		<a href="/privacy">Privacy</a>
		<a href="/api/health">System status</a>
	</div>
</footer>
