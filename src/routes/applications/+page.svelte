<script lang="ts">
	let { data } = $props();
</script>

<section class="hero">
	<div>
		<p class="eyebrow">Applications</p>
		<h1>A deliberate pipeline, not an apply cannon.</h1>
		<p class="lede">Every handoff has a state, a current packet, and a user-controlled final submission.</p>
	</div>
</section>

{#if data.hostedDemo}
	<section class="panel empty" style="margin-top: 1rem">
		<h2>Application tracking is local-only</h2>
		<p>The hosted preview does not collect contact details, resumes, application packets, or submission history.</p>
		<a class="button" href="/">Browse match preview</a>
	</section>
{:else if data.applications.length === 0}
	<section class="panel empty" style="margin-top: 1rem">
		<h2>No applications yet</h2>
		<p>Shortlist a strong match to begin.</p>
		<a class="button" href="/">Browse matches</a>
	</section>
{:else}
	<section class="stack" style="margin-top: 1rem">
		{#each data.applications as application}
			<article class="panel application-row">
				<div>
					<p class="eyebrow">{application.job.company}</p>
					<h2><a href={`/jobs/${application.job.id}`}>{application.job.title}</a></h2>
					<div class="meta">
						<span>{application.job.location}</span>
						<span>Updated {new Date(application.updatedAt).toLocaleString()}</span>
					</div>
					{#if application.confirmationId}<p>Confirmation: {application.confirmationId}</p>{/if}
				</div>
				<span class="badge good">{application.state.replaceAll('_', ' ')}</span>
			</article>
		{/each}
	</section>
{/if}
