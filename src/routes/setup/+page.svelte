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
	<div class="notice">
		This public demo uses a tailored professional profile while keeping identity, contact details,
		resume files, and application data out of the deployment.
	</div>
{:else if data.saved}<div class="notice good">Profile saved. Future scores use this version.</div>{/if}
{#if form?.message}<div class="notice bad">{form.message}</div>{/if}
{#if data.profile?.resumePath && !data.resumeExists}
	<div class="notice bad">The configured resume path does not currently exist.</div>
{/if}

{#if data.hostedDemo}
	<section class="panel stack" style="margin-top: 1rem">
		<div>
			<p class="eyebrow">Active match profile</p>
			<h2>Staff AI and backend infrastructure engineer</h2>
			<p class="hint">Verified public experience only. No private application identity is loaded.</p>
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
			<div class="wide">
				<h3>Location scope</h3>
				<div class="tag-list">
					{#each data.publicProfile?.preferredLocations ?? [] as location}<span class="badge">{location}</span>{/each}
					<span class="badge">Remote or onsite considered</span>
				</div>
			</div>
		</div>
		<a class="button secondary" href="/">Back to tailored matches</a>
	</section>
{/if}

{#if !data.hostedDemo}<form method="POST" class="panel stack" style="margin-top: 1rem">
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
			Work-location rule
			<select name="remotePreference" value={data.profile?.remotePreference ?? 'any'}>
				<option value="any">Any arrangement</option>
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
