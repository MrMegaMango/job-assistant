import type { SourceProvider } from '$lib/types';
import { safeBoardToken } from './text';

function providerAndTokenFromUrl(url: URL): { provider: SourceProvider; boardToken: string } {
	if (url.protocol !== 'https:') throw new Error('Company board URLs must use HTTPS.');

	const host = url.hostname.toLowerCase();
	const parts = url.pathname.split('/').filter(Boolean);
	if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
		const token = url.searchParams.get('for') ?? parts[0];
		if (token) return { provider: 'greenhouse', boardToken: safeBoardToken(token) };
	}
	if (host === 'boards-api.greenhouse.io') {
		const index = parts.indexOf('boards');
		if (index >= 0 && parts[index + 1]) {
			return { provider: 'greenhouse', boardToken: safeBoardToken(parts[index + 1]) };
		}
	}

	if (host === 'jobs.ashbyhq.com' && parts[0]) {
		return { provider: 'ashby', boardToken: safeBoardToken(parts[0]) };
	}
	if (host === 'api.ashbyhq.com') {
		const index = parts.indexOf('job-board');
		if (index >= 0 && parts[index + 1]) {
			return { provider: 'ashby', boardToken: safeBoardToken(parts[index + 1]) };
		}
	}

	if (host === 'jobs.lever.co' && parts[0]) {
		return { provider: 'lever', boardToken: safeBoardToken(parts[0]) };
	}
	if (host === 'api.lever.co') {
		const index = parts.indexOf('postings');
		if (index >= 0 && parts[index + 1]) {
			return { provider: 'lever', boardToken: safeBoardToken(parts[index + 1]) };
		}
	}

	throw new Error('Use a public Greenhouse, Ashby, or Lever company board URL.');
}

export function parseBoardInput(
	providerInput: string,
	boardInput: string
): { provider: SourceProvider; boardToken: string } {
	const provider = ['greenhouse', 'ashby', 'lever'].includes(providerInput)
		? (providerInput as SourceProvider)
		: null;
	const value = boardInput.trim();
	if (!value) throw new Error('Add a board slug or URL.');

	if (/^https?:\/\//i.test(value)) {
		const detected = providerAndTokenFromUrl(new URL(value));
		if (provider && provider !== detected.provider) {
			throw new Error(`That URL is for ${detected.provider}, not ${provider}.`);
		}
		return detected;
	}

	if (!provider) throw new Error('Choose an ATS provider when entering a board slug.');
	return { provider, boardToken: safeBoardToken(value) };
}
