import type { JobSource } from '$lib/types';
import { fetchSource } from './connectors';
import { listSources, recordSourceFailure, upsertSourceJobs } from './store';

export interface SyncResult {
	source: string;
	count: number;
	error: string | null;
}

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

export async function syncEnabledSources(): Promise<SyncResult[]> {
	const sources = listSources().filter((source) => source.enabled);
	const results: SyncResult[] = [];
	for (let index = 0; index < sources.length; index += 3) {
		results.push(...(await Promise.all(sources.slice(index, index + 3).map(syncOne))));
	}
	return results;
}
