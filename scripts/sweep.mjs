/**
 * Nightly source sync for the owner's computer. It fetches every catalog source with the same
 * connectors the app uses and writes the fresh remote jobs as one static snapshot, which the
 * hosted preview loads on a cold start instead of fetching every feed from Vercel.
 *
 *   node scripts/sweep.mjs <data-dir>
 *
 * Writes <data-dir>/site/jobs.json (the only published file). Exits non-zero, without writing,
 * when most sources fail. scripts/nightly-sweep.sh schedules and publishes it. No private
 * profile or application data is read.
 */
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'vite';

const CONCURRENCY = 12;

const dataDir = process.argv[2];
if (!dataDir) throw new Error('Usage: sweep.mjs <data-dir>');
const log = (message) => console.log(`${new Date().toISOString()} ${message}`);

// Vite resolves the app's `$lib` aliases; middleware mode never opens a listening port.
const vite = await createServer({
	server: { middlewareMode: true, hmr: false },
	appType: 'custom',
	logLevel: 'error'
});
try {
	const { DEFAULT_SOURCES } = await vite.ssrLoadModule('/src/lib/server/source-catalog.ts');
	const { fetchSource } = await vite.ssrLoadModule('/src/lib/server/connectors/index.ts');
	const { freshRemoteJobs } = await vite.ssrLoadModule('/src/lib/server/listing-age.ts');
	const { jobsSnapshotSchema } = await vite.ssrLoadModule('/src/lib/server/jobs-snapshot.ts');

	log(`Syncing ${DEFAULT_SOURCES.length} sources`);
	const now = Date.now();
	const sources = new Array(DEFAULT_SOURCES.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: CONCURRENCY }, async () => {
			while (next < DEFAULT_SOURCES.length) {
				const index = next++;
				const { provider, name, boardToken, policyUrl } = DEFAULT_SOURCES[index];
				const source = { id: index + 1, provider, name, boardToken, policyUrl, enabled: true };
				try {
					const jobs = freshRemoteJobs(await fetchSource(source), now);
					sources[index] = { provider, boardToken, name, error: null, jobs };
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unknown source error';
					sources[index] = { provider, boardToken, name, error: message.slice(0, 500), jobs: [] };
				}
			}
		})
	);
	const failed = sources.filter((source) => source.error).length;
	if (failed > sources.length / 2)
		throw new Error(`${failed} of ${sources.length} sources failed; not publishing.`);

	const snapshot = jobsSnapshotSchema.parse({
		version: 1,
		generatedAt: new Date().toISOString(),
		sources
	});
	const path = join(dataDir, 'site', 'jobs.json');
	await mkdir(join(dataDir, 'site'), { recursive: true });
	// Write atomically so a publish never reads a half-written file.
	await writeFile(`${path}.tmp`, JSON.stringify(snapshot));
	await rename(`${path}.tmp`, path);
	const jobs = sources.reduce((total, source) => total + source.jobs.length, 0);
	log(`Wrote ${jobs} fresh remote jobs from ${sources.length - failed} sources to ${path}`);
} finally {
	await vite.close();
}
