const ALLOWED_HOSTS = new Set(['himalayas.app', 'techcrunch.com', 'news.crunchbase.com']);
const MAX_BYTES = 2 * 1024 * 1024;

export function publicHttpsUrl(value: unknown): string | null {
	if (typeof value !== 'string' || value.length > 2500) return null;
	try {
		const url = new URL(value);
		if (url.protocol !== 'https:' || url.username || url.password || url.port ||
			!url.hostname.includes('.') || /^(?:\d|\[)/.test(url.hostname) ||
			/\.(?:local|localhost|internal)$/.test(url.hostname)) return null;
		url.hash = '';
		return url.href;
	} catch { return null; }
}

// Only fixed provider endpoints are fetched. Results never supply fetch destinations.
export async function discoveryText(url: URL): Promise<string> {
	if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname) || url.username || url.password) {
		throw new Error('Unsupported discovery provider.');
	}
	const response = await fetch(url, {
		redirect: 'error',
		headers: { accept: 'application/json, application/rss+xml, application/xml', 'user-agent': 'HighMatch/0.1' },
		signal: AbortSignal.timeout(8_000)
	});
	if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
	if (Number(response.headers.get('content-length') ?? 0) > MAX_BYTES) {
		throw new Error('Provider response was too large.');
	}
	if (!response.body) throw new Error('Provider returned an empty response.');
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let length = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			length += value.length;
			if (length > MAX_BYTES) throw new Error('Provider response was too large.');
			chunks.push(value);
		}
	} finally { await reader.cancel(); }
	return Buffer.concat(chunks).toString('utf8');
}
