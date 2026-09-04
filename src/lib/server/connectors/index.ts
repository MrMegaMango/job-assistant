import type { JobSource, NormalizedJob } from '$lib/types';
import { fetchAshby } from './ashby';
import { fetchGreenhouse } from './greenhouse';
import { fetchLever } from './lever';
import { fetchWeWorkRemotely } from './we-work-remotely';

export async function fetchSource(source: JobSource): Promise<NormalizedJob[]> {
	switch (source.provider) {
		case 'greenhouse':
			return fetchGreenhouse(source);
		case 'ashby':
			return fetchAshby(source);
		case 'lever':
			return fetchLever(source);
		case 'wwr':
			return fetchWeWorkRemotely(source);
	}
}
