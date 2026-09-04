import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let testDir = '';

beforeEach(() => {
	testDir = mkdtempSync(join(tmpdir(), 'job-assistant-database-test-'));
	process.env.JOB_ASSISTANT_DATA_DIR = testDir;
	vi.resetModules();
});

afterEach(async () => {
	const { closeDbForTests } = await import('./database');
	closeDbForTests();
	delete process.env.JOB_ASSISTANT_DATA_DIR;
	rmSync(testDir, { recursive: true, force: true });
});

describe('database migrations', () => {
	it('adds the soft remote preference without changing an existing preference', async () => {
		const legacy = new Database(join(testDir, 'job-assistant.sqlite'));
		legacy.exec(`
			CREATE TABLE profiles (
				id INTEGER PRIMARY KEY CHECK (id = 1),
				name TEXT NOT NULL DEFAULT '',
				email TEXT NOT NULL DEFAULT '',
				phone TEXT NOT NULL DEFAULT '',
				resume_path TEXT NOT NULL DEFAULT '',
				target_titles_json TEXT NOT NULL,
				skills_json TEXT NOT NULL,
				preferred_locations_json TEXT NOT NULL,
				remote_preference TEXT NOT NULL CHECK (remote_preference IN ('remote', 'hybrid', 'any')),
				min_base_salary INTEGER,
				excluded_keywords_json TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			INSERT INTO profiles (
				id, target_titles_json, skills_json, preferred_locations_json,
				remote_preference, excluded_keywords_json, updated_at
			) VALUES (1, '["Software Engineer"]', '["TypeScript"]', '["Remote"]', 'any', '[]', '2026-08-25T00:00:00.000Z');
		`);
		legacy.close();

		const { getDb } = await import('./database');
		const db = getDb();
		const original = db.prepare('SELECT remote_preference FROM profiles WHERE id = 1').get() as {
			remote_preference: string;
		};
		expect(original.remote_preference).toBe('any');

		expect(() =>
			db.prepare("UPDATE profiles SET remote_preference = 'remote_preferred' WHERE id = 1").run()
		).not.toThrow();
	});

	it('adds approved RSS providers without losing existing source settings', async () => {
		const legacy = new Database(join(testDir, 'job-assistant.sqlite'));
		legacy.exec(`
			CREATE TABLE sources (
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
			INSERT INTO sources (provider, name, board_token, enabled, policy_url)
			VALUES ('greenhouse', 'Existing', 'existing', 0, 'https://example.com/policy');
		`);
		legacy.close();

		const { getDb } = await import('./database');
		const db = getDb();
		const existing = db
			.prepare("SELECT enabled FROM sources WHERE provider = 'greenhouse' AND board_token = 'existing'")
			.get() as { enabled: number };
		expect(existing.enabled).toBe(0);
		expect(() =>
			db
				.prepare('INSERT INTO sources (provider, name, board_token, policy_url) VALUES (?, ?, ?, ?)')
				.run('wwr', 'RSS', 'test-feed', 'https://example.com/policy')
		).not.toThrow();
	});
});
