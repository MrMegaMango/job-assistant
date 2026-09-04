const MAX_RESPONSE_BYTES = 40 * 1024 * 1024;

export async function fetchJson(url: string): Promise<unknown> {
	const parsed = new URL(url);
	if (parsed.protocol !== 'https:') throw new Error('Job sources must use HTTPS.');

	const response = await fetch(parsed, {
		headers: {
			accept: 'application/json',
			'user-agent': 'job-assistant/0.1 (private local job search)'
		},
		signal: AbortSignal.timeout(20_000)
	});
	if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
	const contentLength = Number(response.headers.get('content-length') ?? 0);
	if (contentLength > MAX_RESPONSE_BYTES) throw new Error('Source response exceeded the 40 MB limit.');
	return response.json();
}

export async function fetchText(url: string, accept: string): Promise<string> {
	const parsed = new URL(url);
	if (parsed.protocol !== 'https:') throw new Error('Job sources must use HTTPS.');

	const response = await fetch(parsed, {
		headers: {
			accept,
			'user-agent': 'job-assistant/0.1 (private local job search)'
		},
		signal: AbortSignal.timeout(20_000)
	});
	if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
	const contentLength = Number(response.headers.get('content-length') ?? 0);
	if (contentLength > MAX_RESPONSE_BYTES) throw new Error('Source response exceeded the 40 MB limit.');
	return response.text();
}
