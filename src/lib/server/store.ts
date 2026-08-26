import { createHash } from 'node:crypto';
import type {
	ApplicationRecord,
	CandidateProfile,
	JobSource,
	MatchResult,
	NormalizedJob,
	RankedJob,
	SalaryRange,
	SourceProvider,
	StoredJob
} from '$lib/types';
import { getDb } from './database';
import { scoreJob } from './scoring';

type ProfileRow = {
	id: number;
	name: string;
	email: string;
	phone: string;
	resume_path: string;
	target_titles_json: string;
	skills_json: string;
	preferred_locations_json: string;
	remote_preference: CandidateProfile['remotePreference'];
	min_base_salary: number | null;
	excluded_keywords_json: string;
	updated_at: string;
};

type SourceRow = {
	id: number;
	provider: SourceProvider;
	name: string;
	board_token: string;
	enabled: number;
	policy_url: string;
	apply_mode: JobSource['applyMode'];
	last_synced_at: string | null;
	last_error: string | null;
};

type JobRow = {
	id: number;
	source_id: number;
	source_provider: SourceProvider;
	source_name: string;
	external_id: string;
	company: string;
	title: string;
	location: string;
	remote: number;
	description: string;
	canonical_url: string;
	apply_url: string;
	posted_at: string | null;
	updated_at: string | null;
	salary_min: number | null;
	salary_max: number | null;
	salary_currency: string | null;
	salary_period: SalaryRange['period'] | null;
	salary_source_type: SalaryRange['sourceType'] | null;
	salary_source_url: string | null;
	content_hash: string;
	first_seen_at: string;
	last_seen_at: string;
	is_active: number;
	application_state?: ApplicationRecord['state'] | null;
};

type ApplicationRow = {
	id: number;
	job_id: number;
	state: ApplicationRecord['state'];
	packet_json: string | null;
	packet_hash: string | null;
	confirmation_id: string | null;
	created_at: string;
	updated_at: string;
};

export function hashValue(value: unknown): string {
	return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function parseJson<T>(value: string): T {
	return JSON.parse(value) as T;
}

function profileFromRow(row: ProfileRow): CandidateProfile {
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		phone: row.phone,
		resumePath: row.resume_path,
		targetTitles: parseJson<string[]>(row.target_titles_json),
		skills: parseJson<string[]>(row.skills_json),
		preferredLocations: parseJson<string[]>(row.preferred_locations_json),
		remotePreference: row.remote_preference,
		minBaseSalary: row.min_base_salary,
		excludedKeywords: parseJson<string[]>(row.excluded_keywords_json),
		updatedAt: row.updated_at
	};
}

function sourceFromRow(row: SourceRow): JobSource {
	return {
		id: row.id,
		provider: row.provider,
		name: row.name,
		boardToken: row.board_token,
		enabled: Boolean(row.enabled),
		policyUrl: row.policy_url,
		applyMode: row.apply_mode,
		lastSyncedAt: row.last_synced_at,
		lastError: row.last_error
	};
}

function jobFromRow(row: JobRow): StoredJob {
	const salary: SalaryRange | null =
		row.salary_min !== null &&
		row.salary_max !== null &&
		row.salary_currency !== null &&
		row.salary_period !== null &&
		row.salary_source_type !== null &&
		row.salary_source_url !== null
			? {
					min: row.salary_min,
					max: row.salary_max,
					currency: row.salary_currency,
					period: row.salary_period,
					sourceType: row.salary_source_type,
					sourceUrl: row.salary_source_url
				}
			: null;

	return {
		id: row.id,
		sourceId: row.source_id,
		sourceProvider: row.source_provider,
		sourceName: row.source_name,
		externalId: row.external_id,
		company: row.company,
		title: row.title,
		location: row.location,
		remote: Boolean(row.remote),
		description: row.description,
		canonicalUrl: row.canonical_url,
		applyUrl: row.apply_url,
		postedAt: row.posted_at,
		updatedAt: row.updated_at,
		salary,
		contentHash: row.content_hash,
		firstSeenAt: row.first_seen_at,
		lastSeenAt: row.last_seen_at,
		isActive: Boolean(row.is_active)
	};
}

function applicationFromRow(row: ApplicationRow): ApplicationRecord {
	return {
		id: row.id,
		jobId: row.job_id,
		state: row.state,
		packet: row.packet_json ? parseJson(row.packet_json) : null,
		packetHash: row.packet_hash,
		confirmationId: row.confirmation_id,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function getProfile(): CandidateProfile {
	const row = getDb().prepare('SELECT * FROM profiles WHERE id = 1').get() as ProfileRow;
	return profileFromRow(row);
}

export function saveProfile(profile: Omit<CandidateProfile, 'id' | 'updatedAt'>): CandidateProfile {
	const now = new Date().toISOString();
	getDb()
		.prepare(`
			UPDATE profiles SET
				name = ?, email = ?, phone = ?, resume_path = ?, target_titles_json = ?,
				skills_json = ?, preferred_locations_json = ?, remote_preference = ?,
				min_base_salary = ?, excluded_keywords_json = ?, updated_at = ?
			WHERE id = 1
		`)
		.run(
			profile.name.trim(),
			profile.email.trim(),
			profile.phone.trim(),
			profile.resumePath.trim(),
			JSON.stringify(profile.targetTitles),
			JSON.stringify(profile.skills),
			JSON.stringify(profile.preferredLocations),
			profile.remotePreference,
			profile.minBaseSalary,
			JSON.stringify(profile.excludedKeywords),
			now
		);
	audit('profile.updated', 'profile', 1, { targetTitleCount: profile.targetTitles.length, skillCount: profile.skills.length });
	return getProfile();
}

export function listSources(): JobSource[] {
	const rows = getDb().prepare('SELECT * FROM sources ORDER BY name').all() as SourceRow[];
	return rows.map(sourceFromRow);
}

export function setSourceEnabled(id: number, enabled: boolean): void {
	getDb().prepare('UPDATE sources SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
	audit('source.toggled', 'source', id, { enabled });
}

export function addSource(input: {
	provider: SourceProvider;
	name: string;
	boardToken: string;
	policyUrl: string;
}): void {
	getDb()
		.prepare(`
			INSERT INTO sources (provider, name, board_token, enabled, policy_url, apply_mode)
			VALUES (?, ?, ?, 1, ?, 'link_only')
			ON CONFLICT(provider, board_token) DO UPDATE SET name = excluded.name, enabled = 1
		`)
		.run(input.provider, input.name.trim(), input.boardToken, input.policyUrl);
}

export function recordSourceFailure(id: number, message: string): void {
	getDb().prepare('UPDATE sources SET last_error = ? WHERE id = ?').run(message.slice(0, 500), id);
	audit('source.sync_failed', 'source', id, { message: message.slice(0, 200) });
}

export function upsertSourceJobs(source: JobSource, jobs: NormalizedJob[]): number {
	const db = getDb();
	const now = new Date().toISOString();
	const upsert = db.prepare(`
		INSERT INTO jobs (
			source_id, external_id, company, title, location, remote, description,
			canonical_url, apply_url, posted_at, updated_at, salary_min, salary_max,
			salary_currency, salary_period, salary_source_type, salary_source_url,
			content_hash, first_seen_at, last_seen_at, is_active
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
		ON CONFLICT(source_id, external_id) DO UPDATE SET
			company = excluded.company,
			title = excluded.title,
			location = excluded.location,
			remote = excluded.remote,
			description = excluded.description,
			canonical_url = excluded.canonical_url,
			apply_url = excluded.apply_url,
			posted_at = excluded.posted_at,
			updated_at = excluded.updated_at,
			salary_min = excluded.salary_min,
			salary_max = excluded.salary_max,
			salary_currency = excluded.salary_currency,
			salary_period = excluded.salary_period,
			salary_source_type = excluded.salary_source_type,
			salary_source_url = excluded.salary_source_url,
			content_hash = excluded.content_hash,
			last_seen_at = excluded.last_seen_at,
			is_active = 1
	`);
	const findId = db.prepare('SELECT id FROM jobs WHERE source_id = ? AND external_id = ?');
	const revision = db.prepare(`
		INSERT OR IGNORE INTO job_revisions (job_id, content_hash, normalized_json, fetched_at)
		VALUES (?, ?, ?, ?)
	`);

	const transaction = db.transaction(() => {
		db.prepare('UPDATE jobs SET is_active = 0 WHERE source_id = ?').run(source.id);
		for (const job of jobs) {
			const contentHash = hashValue(job);
			upsert.run(
				source.id,
				job.externalId,
				job.company,
				job.title,
				job.location,
				job.remote ? 1 : 0,
				job.description,
				job.canonicalUrl,
				job.applyUrl,
				job.postedAt,
				job.updatedAt,
				job.salary?.min ?? null,
				job.salary?.max ?? null,
				job.salary?.currency ?? null,
				job.salary?.period ?? null,
				job.salary?.sourceType ?? null,
				job.salary?.sourceUrl ?? null,
				contentHash,
				now,
				now
			);
			const row = findId.get(source.id, job.externalId) as { id: number };
			revision.run(row.id, contentHash, JSON.stringify(job), now);
		}
		db.prepare('UPDATE sources SET last_synced_at = ?, last_error = NULL WHERE id = ?').run(now, source.id);
	});
	transaction();
	audit('source.synced', 'source', source.id, { jobCount: jobs.length });
	return jobs.length;
}

const JOB_SELECT = `
	SELECT
		j.*,
		s.provider AS source_provider,
		s.name AS source_name,
		a.state AS application_state
	FROM jobs j
	JOIN sources s ON s.id = j.source_id
	LEFT JOIN applications a ON a.job_id = j.id
`;

function cacheMatch(job: StoredJob, profile: CandidateProfile, result: MatchResult): void {
	getDb()
		.prepare(`
			INSERT OR IGNORE INTO match_runs (
				job_id, profile_updated_at, job_content_hash, result_json, created_at
			) VALUES (?, ?, ?, ?, ?)
		`)
		.run(job.id, profile.updatedAt, job.contentHash, JSON.stringify(result), new Date().toISOString());
}

export function listRankedJobs(options: {
	minimumScore?: number;
	limit?: number;
	includeRejected?: boolean;
} = {}): RankedJob[] {
	const profile = getProfile();
	const rows = getDb()
		.prepare(`${JOB_SELECT} WHERE j.is_active = 1 ORDER BY j.last_seen_at DESC`)
		.all() as JobRow[];
	const minimumScore = options.minimumScore ?? 35;
	const ranked = rows.map((row) => {
		const job = jobFromRow(row);
		const match = scoreJob(profile, job);
		cacheMatch(job, profile, match);
		return { ...job, match, applicationState: row.application_state ?? null };
	});
	return ranked
		.filter((job) => (options.includeRejected ? true : !job.match.hardRejected))
		.filter((job) => job.match.score >= minimumScore)
		.sort((a, b) => b.match.score - a.match.score || b.match.confidence - a.match.confidence)
		.slice(0, options.limit ?? 100);
}

export function getJob(id: number): RankedJob | null {
	const row = getDb().prepare(`${JOB_SELECT} WHERE j.id = ?`).get(id) as JobRow | undefined;
	if (!row) return null;
	const profile = getProfile();
	const job = jobFromRow(row);
	const match = scoreJob(profile, job);
	cacheMatch(job, profile, match);
	return { ...job, match, applicationState: row.application_state ?? null };
}

export function getApplicationForJob(jobId: number): ApplicationRecord | null {
	const row = getDb().prepare('SELECT * FROM applications WHERE job_id = ?').get(jobId) as
		| ApplicationRow
		| undefined;
	return row ? applicationFromRow(row) : null;
}

export function listApplications(): Array<ApplicationRecord & { job: StoredJob }> {
	const rows = getDb()
		.prepare(`${JOB_SELECT} WHERE a.id IS NOT NULL ORDER BY a.updated_at DESC`)
		.all() as JobRow[];
	return rows.map((row) => {
		const application = getApplicationForJob(row.id);
		if (!application) throw new Error('Application join returned an inconsistent row.');
		return { ...application, job: jobFromRow(row) };
	});
}

export function getStats(): { activeJobs: number; jobsWithPostedPay: number } {
	const row = getDb()
		.prepare(`
			SELECT
				COUNT(*) AS active_jobs,
				SUM(CASE WHEN salary_source_type = 'employer_posted' THEN 1 ELSE 0 END) AS jobs_with_posted_pay
			FROM jobs
			WHERE is_active = 1
		`)
		.get() as { active_jobs: number; jobs_with_posted_pay: number | null };
	return { activeJobs: row.active_jobs, jobsWithPostedPay: row.jobs_with_posted_pay ?? 0 };
}

export function audit(eventType: string, entityType: string, entityId: number | null, metadata: unknown): void {
	getDb()
		.prepare(`
			INSERT INTO audit_events (event_type, entity_type, entity_id, metadata_json, created_at)
			VALUES (?, ?, ?, ?, ?)
		`)
		.run(eventType, entityType, entityId, JSON.stringify(metadata), new Date().toISOString());
}
