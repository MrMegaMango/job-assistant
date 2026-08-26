import Database from 'better-sqlite3';
import { join } from 'node:path';
import type { SourceProvider } from '$lib/types';
import { getDataDir } from './paths';

let instance: Database.Database | undefined;

const DEFAULT_SOURCES: Array<{
	provider: SourceProvider;
	name: string;
	boardToken: string;
	policyUrl: string;
}> = [
	{
		provider: 'greenhouse',
		name: 'Anthropic',
		boardToken: 'anthropic',
		policyUrl: 'https://developer.greenhouse.io/job-board.html'
	},
	{
		provider: 'greenhouse',
		name: 'Scale AI',
		boardToken: 'scaleai',
		policyUrl: 'https://developer.greenhouse.io/job-board.html'
	},
	{
		provider: 'ashby',
		name: 'Modal',
		boardToken: 'modal',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Baseten',
		boardToken: 'baseten',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Cohere',
		boardToken: 'cohere',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Perplexity',
		boardToken: 'perplexity',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Fireworks AI',
		boardToken: 'fireworks',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Anyscale',
		boardToken: 'anyscale',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Lambda',
		boardToken: 'lambda',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Prime Intellect',
		boardToken: 'primeintellect',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'greenhouse',
		name: 'CoreWeave',
		boardToken: 'coreweave',
		policyUrl: 'https://developer.greenhouse.io/job-board.html'
	},
	{
		provider: 'ashby',
		name: 'OpenAI',
		boardToken: 'openai',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Cursor',
		boardToken: 'cursor',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Runway',
		boardToken: 'runway-ml',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'E2B',
		boardToken: 'e2b',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	},
	{
		provider: 'ashby',
		name: 'Pika',
		boardToken: 'pika',
		policyUrl: 'https://developers.ashbyhq.com/docs/public-job-posting-api'
	}
];

function migrate(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS profiles (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			name TEXT NOT NULL DEFAULT '',
			email TEXT NOT NULL DEFAULT '',
			phone TEXT NOT NULL DEFAULT '',
			resume_path TEXT NOT NULL DEFAULT '',
			target_titles_json TEXT NOT NULL,
			skills_json TEXT NOT NULL,
			focus_areas_json TEXT NOT NULL DEFAULT '[]',
			preferred_locations_json TEXT NOT NULL,
			remote_preference TEXT NOT NULL CHECK (remote_preference IN ('remote', 'hybrid', 'any')),
			min_base_salary INTEGER,
			excluded_keywords_json TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sources (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			provider TEXT NOT NULL CHECK (provider IN ('greenhouse', 'ashby', 'lever')),
			name TEXT NOT NULL,
			board_token TEXT NOT NULL,
			enabled INTEGER NOT NULL DEFAULT 1,
			policy_url TEXT NOT NULL,
			apply_mode TEXT NOT NULL DEFAULT 'link_only' CHECK (apply_mode IN ('link_only', 'assisted')),
			last_synced_at TEXT,
			last_error TEXT,
			UNIQUE(provider, board_token)
		);

		CREATE TABLE IF NOT EXISTS jobs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
			external_id TEXT NOT NULL,
			company TEXT NOT NULL,
			title TEXT NOT NULL,
			location TEXT NOT NULL,
			remote INTEGER NOT NULL,
			description TEXT NOT NULL,
			canonical_url TEXT NOT NULL,
			apply_url TEXT NOT NULL,
			posted_at TEXT,
			updated_at TEXT,
			salary_min INTEGER,
			salary_max INTEGER,
			salary_currency TEXT,
			salary_period TEXT,
			salary_source_type TEXT,
			salary_source_url TEXT,
			content_hash TEXT NOT NULL,
			first_seen_at TEXT NOT NULL,
			last_seen_at TEXT NOT NULL,
			is_active INTEGER NOT NULL DEFAULT 1,
			UNIQUE(source_id, external_id)
		);

		CREATE INDEX IF NOT EXISTS jobs_active_idx ON jobs(is_active, last_seen_at DESC);
		CREATE INDEX IF NOT EXISTS jobs_company_title_idx ON jobs(company, title);

		CREATE TABLE IF NOT EXISTS job_revisions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
			content_hash TEXT NOT NULL,
			normalized_json TEXT NOT NULL,
			fetched_at TEXT NOT NULL,
			UNIQUE(job_id, content_hash)
		);

		CREATE TABLE IF NOT EXISTS match_runs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
			profile_updated_at TEXT NOT NULL,
			job_content_hash TEXT NOT NULL,
			result_json TEXT NOT NULL,
			created_at TEXT NOT NULL,
			UNIQUE(job_id, profile_updated_at, job_content_hash)
		);

		CREATE TABLE IF NOT EXISTS applications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
			state TEXT NOT NULL,
			packet_json TEXT,
			packet_hash TEXT,
			confirmation_id TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS approval_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
			target_domain TEXT NOT NULL,
			packet_hash TEXT NOT NULL,
			approved_at TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			consumed_at TEXT
		);

		CREATE TABLE IF NOT EXISTS audit_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			event_type TEXT NOT NULL,
			entity_type TEXT NOT NULL,
			entity_id INTEGER,
			metadata_json TEXT NOT NULL,
			created_at TEXT NOT NULL
		);
	`);

	const profileColumns = db.prepare('PRAGMA table_info(profiles)').all() as Array<{ name: string }>;
	if (!profileColumns.some((column) => column.name === 'focus_areas_json')) {
		db.exec("ALTER TABLE profiles ADD COLUMN focus_areas_json TEXT NOT NULL DEFAULT '[]'");
	}
	db.prepare("UPDATE profiles SET focus_areas_json = ? WHERE focus_areas_json = '[]'").run(
		JSON.stringify(['Backend infrastructure', 'Platform engineering', 'Distributed systems'])
	);

	const now = new Date().toISOString();
	db.prepare(`
		INSERT OR IGNORE INTO profiles (
			id, target_titles_json, skills_json, focus_areas_json, preferred_locations_json,
			remote_preference, min_base_salary, excluded_keywords_json, updated_at
		) VALUES (1, ?, ?, ?, ?, 'any', NULL, ?, ?)
	`).run(
		JSON.stringify(['Software Engineer', 'Machine Learning Engineer', 'Platform Engineer']),
		JSON.stringify(['Python', 'TypeScript', 'SQL']),
		JSON.stringify(['Backend infrastructure', 'Machine learning', 'Platform engineering']),
		JSON.stringify(['Remote']),
		JSON.stringify([]),
		now
	);

	const insertSource = db.prepare(`
		INSERT OR IGNORE INTO sources (provider, name, board_token, enabled, policy_url, apply_mode)
		VALUES (?, ?, ?, 1, ?, 'link_only')
	`);
	for (const source of DEFAULT_SOURCES) {
		insertSource.run(source.provider, source.name, source.boardToken, source.policyUrl);
	}
}

export function getDb(): Database.Database {
	if (instance) return instance;
	instance = new Database(join(getDataDir(), 'job-assistant.sqlite'));
	instance.pragma('journal_mode = WAL');
	instance.pragma('foreign_keys = ON');
	instance.pragma('busy_timeout = 5000');
	migrate(instance);
	return instance;
}

export function closeDbForTests(): void {
	instance?.close();
	instance = undefined;
}
