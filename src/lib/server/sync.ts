import type { JobSource } from '$lib/types';
import { fetchSource } from './connectors';
import { isHostedDemo } from './deployment';
import { getListingAge, isRecentListing } from './listing-age';
import { hasRecentActiveRemoteJobs, listSources, recordSourceFailure, upsertSourceJobs } from './store';

export interface SyncResult {
	source: string;
	count: number;
	error: string | null;
}

const SYNC_CONCURRENCY = 12;
const HOSTED_EMPTY_REFRESH_BACKOFF_MS = 30 * 60 * 1000;
let hostedSyncInFlight: Promise<SyncResult[]> | null = null;

function hasRecentSourceSync(sources: JobSource[], now: number): boolean {
	return sources.some((source) => {
		if (!source.enabled || !source.lastSyncedAt) return false;
		const syncedAt = Date.parse(source.lastSyncedAt);
		return Number.isFinite(syncedAt) && syncedAt <= now && now - syncedAt < HOSTED_EMPTY_REFRESH_BACKOFF_MS;
	});
}

async function syncOne(source: JobSource, now: number, hosted: boolean): Promise<SyncResult> {
	try {
		const jobs = await fetchSource(source);
		const persistedJobs = hosted
			? jobs.filter((job) => job.remote && isRecentListing(getListingAge(job.postedAt, now)))
			: jobs;
		return { source: source.name, count: upsertSourceJobs(source, persistedJobs), error: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown source error';
		recordSourceFailure(source.id, message);
		return { source: source.name, count: 0, error: message };
	}
}

async function runSync(): Promise<SyncResult[]> {
	const sources = listSources().filter((source) => source.enabled);
	const results = new Array<SyncResult>(sources.length);
	const now = Date.now();
	const hosted = isHostedDemo();
	let nextIndex = 0;

	async function worker(): Promise<void> {
		while (nextIndex < sources.length) {
			const index = nextIndex++;
			results[index] = await syncOne(sources[index], now, hosted);
		}
	}

	await Promise.all(
		Array.from({ length: Math.min(SYNC_CONCURRENCY, sources.length) }, () => worker())
	);
	return results;
}

export async function syncEnabledSources(): Promise<SyncResult[]> {
	if (!isHostedDemo()) return runSync();
	if (hostedSyncInFlight) return hostedSyncInFlight;

	hostedSyncInFlight = runSync();
	try {
		return await hostedSyncInFlight;
	} finally {
		hostedSyncInFlight = null;
	}
}

export async function ensureHostedJobs(): Promise<void> {
	if (!isHostedDemo() || hasRecentActiveRemoteJobs()) return;
	const now = Date.now();
	if (hasRecentSourceSync(listSources(), now)) return;
	await syncEnabledSources();
}
