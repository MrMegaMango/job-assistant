<script lang="ts">
	interface LeadershipPerson {
		role: string;
		name: string;
		surname: string;
		surnameOrigin: string;
		leadershipUrl?: string;
		surnameReferenceUrl?: string;
	}

	interface LeadershipResearch {
		companySourceUrl: string;
		people: LeadershipPerson[];
		technologyRoleNote?: string;
	}

	let {
		leadership,
		researchedAt,
		context,
		open = false
	}: {
		leadership: LeadershipResearch;
		researchedAt: string;
		context: string;
		open?: boolean;
	} = $props();

	function researchDateLabel(value: string): string {
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'long',
			timeZone: 'UTC'
		}).format(new Date(`${value}T12:00:00Z`));
	}

	const researchedAtLabel = $derived(researchDateLabel(researchedAt));
	const leadershipSummary = $derived(
		leadership.people.map((leader) => `${leader.role}: ${leader.name}`).join(' · ')
	);
</script>

<details class="leadership-details" {open}>
	<summary>
		<span>CEO & technology leadership surname notes</span>
		<span class="leadership-summary-people">{leadershipSummary}</span>
	</summary>
	<div class="leadership-content">
		<p class="surname-context">{context}</p>
		<p class="hint">Public leadership research checked <time datetime={researchedAt}>{researchedAtLabel}</time>.</p>
		<div class="leadership-list">
			{#each leadership.people as leader}
				<div class="leadership-person">
					<div class="leadership-person-heading">
						<span class="badge">{leader.role}</span>
						<strong>{leader.name}</strong>
					</div>
					<p><strong>{leader.surname}</strong> — {leader.surnameOrigin}</p>
					{#if leader.leadershipUrl || leader.surnameReferenceUrl}
						<div class="leadership-links">
							{#if leader.leadershipUrl}
								<a href={leader.leadershipUrl} target="_blank" rel="noreferrer">Role source</a>
							{/if}
							{#if leader.surnameReferenceUrl}
								<a href={leader.surnameReferenceUrl} target="_blank" rel="noreferrer">Surname reference</a>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
		{#if leadership.technologyRoleNote}<p class="notice leadership-note">{leadership.technologyRoleNote}</p>{/if}
		<a href={leadership.companySourceUrl} target="_blank" rel="noreferrer">Company leadership source</a>
	</div>
</details>
