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
});
