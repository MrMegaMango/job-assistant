import type { JobSource } from '$lib/types';
import { fetchSource } from './connectors';
import { isHostedDemo } from './deployment';
import { listSources, recordSourceFailure, upsertSourceJobs } from './store';

export interface SyncResult {
	source: string;
	count: number;
	error: string | null;
}

const SYNC_BATCH_SIZE = 6;
const HOSTED_SYNC_COOLDOWN_MS = 5 * 60 * 1000;
let hostedSyncStartedAt = 0;
let hostedSyncInFlight: Promise<SyncResult[]> | null = null;

async function syncOne(source: JobSource): Promise<SyncResult> {
	try {
		const jobs = await fetchSource(source);
		return { source: source.name, count: upsertSourceJobs(source, jobs), error: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown source error';
		recordSourceFailure(source.id, message);
		return { source: source.name, count: 0, error: message };
	}
}

async function runSync(): Promise<SyncResult[]> {
	const sources = listSources().filter((source) => source.enabled);
	const results: SyncResult[] = [];
	for (let index = 0; index < sources.length; index += SYNC_BATCH_SIZE) {
		results.push(...(await Promise.all(sources.slice(index, index + SYNC_BATCH_SIZE).map(syncOne))));
	}
	return results;
}

export async function syncEnabledSources(): Promise<SyncResult[]> {
	if (!isHostedDemo()) return runSync();
	if (hostedSyncInFlight) return hostedSyncInFlight;

	const remainingMs = HOSTED_SYNC_COOLDOWN_MS - (Date.now() - hostedSyncStartedAt);
	if (remainingMs > 0) {
		return [
			{
				source: 'Hosted demo',
				count: 0,
				error: `Sync is cooling down. Try again in ${Math.ceil(remainingMs / 60_000)} minute(s).`
			}
		];
	}

	hostedSyncStartedAt = Date.now();
	hostedSyncInFlight = runSync();
	try {
		return await hostedSyncInFlight;
	} finally {
		hostedSyncInFlight = null;
	}
}
