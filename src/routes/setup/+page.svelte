<script lang="ts">
	let { data, form } = $props();
</script>

<section class="hero">
	<div>
		<p class="eyebrow">Setup</p>
		<h1>Teach the matcher what “good” means.</h1>
		<p class="lede">
			These are user-verified facts and preferences. They drive ranking and are the only facts the
			application packet may claim.
		</p>
	</div>
</section>

{#if data.hostedDemo}
	{#if data.saved}<div class="notice good">Profile saved. Future scores use this version.</div>{/if}
	{#if data.authError}<div class="notice bad">Google sign-in did not complete. Please try again.</div>{/if}
	{#if data.account?.profileUnavailable}
		<div class="notice bad">Your saved profile is temporarily unavailable. No anonymous profile has overwritten it.</div>
	{:else if data.account?.signedIn}
		<div class="notice good">
			You are signed in. Matching preferences save privately to your account and follow you across devices.
			Contact details, resume files, and applications remain local-only.
		</div>
	{:else}
		<div class="notice">
			You are browsing anonymously. Switch presets without an account, or sign in to create a private,
			editable profile that follows you across devices.
		</div>
	{/if}
{:else if data.saved}<div class="notice good">Profile saved. Future scores use this version.</div>{/if}
{#if form?.message}<div class="notice bad">{form.message}</div>{/if}
{#if data.profile?.resumePath && !data.resumeExists}
	<div class="notice bad">The configured resume path does not currently exist.</div>
{/if}

{#if data.hostedDemo}
	{#if data.account?.signedIn}
		<form method="POST" action="?/saveAccountProfile" class="panel stack" style="margin-top: 1rem">
			<div>
				<p class="eyebrow">Personalized match profile</p>
				<h2>{data.account.profileSaved ? 'Edit your saved profile' : 'Create your profile'}</h2>
				<p class="hint">Only matching facts and preferences are stored online. Include skills you can support with evidence.</p>
			</div>
			<div class="form-grid">
				<label class="wide">
					Target titles
					<textarea name="targetTitles">{data.matchingProfile?.targetTitles.join('\n') ?? ''}</textarea>
					<small>One per line or comma-separated.</small>
				</label>
				<label class="wide">
					Verified skills and domains
					<textarea name="skills">{data.matchingProfile?.skills.join('\n') ?? ''}</textarea>
					<small>Only include facts you can support in an application.</small>
				</label>
				<label class="wide">
					Preferred focus areas
					<textarea name="focusAreas">{data.matchingProfile?.focusAreas.join('\n') ?? ''}</textarea>
				</label>
				<label>
					Preferred locations
					<textarea name="preferredLocations">{data.matchingProfile?.preferredLocations.join('\n') ?? ''}</textarea>
				</label>
				<label>
					Work-location preference
					<select name="remotePreference" value={data.matchingProfile?.remotePreference ?? 'any'}>
						<option value="any">Any arrangement</option>
						<option value="remote_preferred">Remote preferred</option>
						<option value="hybrid">Hybrid preferred</option>
						<option value="remote">Remote required</option>
					</select>
				</label>
				<label>
					Minimum annual base salary
					<input name="minBaseSalary" type="number" min="0" step="5000" value={data.matchingProfile?.minBaseSalary ?? ''} placeholder="Leave blank until decided" />
					<small>Unknown pay remains eligible; disclosed pay below this floor does not.</small>
				</label>
				<label>
					Excluded keywords
					<textarea name="excludedKeywords">{data.matchingProfile?.excludedKeywords.join('\n') ?? ''}</textarea>
				</label>
			</div>
			<div class="inline-actions">
				<button type="submit">Save personalized profile</button>
				<a class="button secondary" href="/">Back to matches</a>
			</div>
		</form>
	{:else}
		<section class="panel stack" style="margin-top: 1rem">
			<div>
				<p class="eyebrow">Active anonymous profile</p>
				<h2>{data.activeDemoProfile?.headline}</h2>
				<p>{data.activeDemoProfile?.description}</p>
				<p class="hint">Verified professional experience only. No private application identity is loaded.</p>
			</div>
			<div class="form-grid">
				<div>
					<h3>Target roles</h3>
					<div class="tag-list">
						{#each data.publicProfile?.targetTitles ?? [] as title}<span class="badge good">{title}</span>{/each}
					</div>
				</div>
				<div>
					<h3>Preferred focus</h3>
					<div class="tag-list">
						{#each data.publicProfile?.focusAreas ?? [] as focus}<span class="badge good">{focus}</span>{/each}
					</div>
				</div>
				<div class="wide">
					<h3>Verified skills</h3>
					<div class="tag-list">
						{#each data.publicProfile?.skills ?? [] as skill}<span class="badge">{skill}</span>{/each}
					</div>
				</div>
			</div>
			<a class="button secondary" href="/">Back to tailored matches</a>
		</section>
		<section class="panel stack" style="margin-top: 1rem">
			<div>
				<p class="eyebrow">Saved profile</p>
				<h2>Make this profile yours.</h2>
				<p>Google sign-in creates one private, editable matching profile for this account. Anonymous browsing remains available.</p>
			</div>
			{#if data.account?.configured}
				<form method="POST" action="/auth/login">
					<input type="hidden" name="returnTo" value="/setup" />
					<button type="submit">Continue with Google</button>
				</form>
			{:else}
				<p class="hint">Google sign-in is not connected on this deployment yet.</p>
			{/if}
		</section>
	{/if}
{/if}

{#if !data.hostedDemo}<form method="POST" action="?/saveLocalProfile" class="panel stack" style="margin-top: 1rem">
	<h2>Application identity</h2>
	<p class="hint">Stored only in the local database outside Git. Nothing here is sent during job sync.</p>
	<div class="form-grid">
		<label>
			Full legal name
			<input name="name" autocomplete="name" value={data.profile?.name ?? ''} />
		</label>
		<label>
			Application email
			<input name="email" type="email" autocomplete="email" value={data.profile?.email ?? ''} />
		</label>
		<label>
			Phone
			<input name="phone" autocomplete="tel" value={data.profile?.phone ?? ''} />
		</label>
		<label>
			Resume path
			<input
				name="resumePath"
				value={data.profile?.resumePath ?? ''}
				placeholder="/home/you/path/to/resume.pdf"
			/>
			<small>Use an absolute path. The file is referenced, not copied into the database.</small>
		</label>
	</div>

	<h2>Matching preferences</h2>
	<div class="form-grid">
		<label class="wide">
			Target titles
			<textarea name="targetTitles">{data.profile?.targetTitles.join('\n') ?? ''}</textarea>
			<small>One per line or comma-separated.</small>
		</label>
		<label class="wide">
			Verified skills and domains
			<textarea name="skills">{data.profile?.skills.join('\n') ?? ''}</textarea>
			<small>Only include facts you can support in an application.</small>
		</label>
		<label class="wide">
			Preferred focus areas
			<textarea name="focusAreas">{data.profile?.focusAreas.join('\n') ?? ''}</textarea>
			<small>Work you want to prioritize, such as model serving or backend infrastructure.</small>
		</label>
		<label>
			Preferred locations
			<textarea name="preferredLocations">{data.profile?.preferredLocations.join('\n') ?? ''}</textarea>
		</label>
		<label>
			Work-location preference
			<select name="remotePreference" value={data.profile?.remotePreference ?? 'any'}>
				<option value="any">Any arrangement</option>
				<option value="remote_preferred">Remote preferred</option>
				<option value="hybrid">Hybrid preferred</option>
				<option value="remote">Remote required</option>
			</select>
		</label>
		<label>
			Minimum annual base salary
			<input
				name="minBaseSalary"
				type="number"
				min="0"
				step="5000"
				value={data.profile?.minBaseSalary ?? ''}
				placeholder="Leave blank until decided"
			/>
			<small>Unknown pay never fails this filter; a disclosed maximum below it does.</small>
		</label>
		<label>
			Excluded keywords
			<textarea name="excludedKeywords">{data.profile?.excludedKeywords.join('\n') ?? ''}</textarea>
			<small>Explicit hard filters, such as a domain you will not work in.</small>
		</label>
	</div>
	<div class="inline-actions">
		<button type="submit">Save verified profile</button>
		<a class="button secondary" href="/">Back to matches</a>
	</div>
</form>{/if}
