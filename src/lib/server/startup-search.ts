import { isIP } from 'node:net';
import { htmlToText } from './text';

export interface StartupJob {
	company: string;
	companySlug: string;
	companyWebsite: string | null;
	title: string;
	description: string;
	location: string;
	remote: boolean;
	listingUrl: string;
	employerUrl: string | null;
	postedAt: string | null;
	listedSalary: string | null;
	expiresAt: string | null;
}

export interface StartupSearchResult {
	jobs: StartupJob[];
	total: number | null;
}

export class AmbiguousCompanyError extends Error {
	constructor() {
		super('Multiple employers share this company name. Hiring could not be linked to the funding report.');
		this.name = 'AmbiguousCompanyError';
	}
}

type Data = Record<string, unknown>;
type ReadTool = 'search_jobs' | 'get_job' | 'get_company_jobs';
type Client = { sessionId: string | null };

const ENDPOINT = 'https://api.startup.jobs/mcp';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 6_000;
const MAX_JOBS = 20;
const MAX_DETAILS = 3;
let nextId = 1;
let clientPromise: Promise<Client> | null = null;

function record(value: unknown): Data | null {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Data)
		: null;
}

function text(value: unknown, limit: number): string {
	if (typeof value !== 'string') return '';
	const bounded = value.slice(0, limit);
	try {
		return htmlToText(bounded);
	} catch {
		return bounded.replace(/<[^>]*>/g, ' ').trim();
	}
}

function httpsUrl(value: unknown): string | null {
	if (typeof value !== 'string' || value.length > 2_000) return null;
	try {
		const url = new URL(value);
		if (
			url.protocol !== 'https:' ||
			url.username ||
			url.password ||
			(url.port && url.port !== '443') ||
			!url.hostname.includes('.') ||
			isIP(url.hostname) ||
			url.hostname.includes(':') ||
			/\.(?:local|localhost|internal|test|invalid)$/.test(url.hostname)
		) return null;
		return url.toString();
	} catch {
		return null;
	}
}

function date(value: unknown): string | null {
	if (typeof value !== 'string' || !value.trim()) return null;
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function companyKey(value: string): string {
	return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function countryCode(value: string): string | null {
	const normalized = value.trim().toLowerCase().replace(/[.]/g, '');
	const names = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
	if (/^[a-z]{2}$/.test(normalized)) {
		const code = normalized === 'uk' ? 'GB' : normalized.toUpperCase();
		return code !== 'ZZ' && names.of(code) ? code : null;
	}
	const aliases: Record<string, string> = {
		usa: 'US',
		'united states': 'US',
		'united states of america': 'US',
		uk: 'GB',
		'united kingdom': 'GB',
		'great britain': 'GB',
		canada: 'CA',
		australia: 'AU',
		germany: 'DE',
		france: 'FR',
		india: 'IN',
		ireland: 'IE',
		'new zealand': 'NZ',
		netherlands: 'NL',
		singapore: 'SG',
		spain: 'ES',
		brazil: 'BR'
	};
	if (aliases[normalized]) return aliases[normalized];
	for (let first = 65; first <= 90; first += 1) {
		for (let second = 65; second <= 90; second += 1) {
			const code = String.fromCharCode(first, second);
			if (code !== 'ZZ' && names.of(code)?.toLowerCase() === normalized) return code;
		}
	}
	return null;
}

function parseJson(value: string): Data {
	try {
		const parsed = record(JSON.parse(value));
		if (parsed) return parsed;
	} catch {
		// A response is data, never instructions to run another tool or visit a URL.
	}
	throw new Error('Startup Jobs returned an unreadable response.');
}

async function readRpc(response: Response, id: number): Promise<Data> {
	if (Number(response.headers.get('content-length') ?? 0) > MAX_RESPONSE_BYTES) {
		await response.body?.cancel();
		throw new Error('Startup Jobs response exceeded the 2 MB limit.');
	}
	const stream = response.body;
	if (!stream) throw new Error('Startup Jobs returned an empty response.');
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	const isSse = response.headers.get('content-type')?.includes('text/event-stream');
	let bytes = 0;
	let buffer = '';

	function event(block: string): Data | null {
		const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:'))
			.map((line) => line.slice(5).trimStart()).join('\n');
		if (!data) return null;
		const parsed = parseJson(data);
		return parsed.id === id ? parsed : null;
	}

	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			bytes += chunk.value.byteLength;
			if (bytes > MAX_RESPONSE_BYTES) {
				throw new Error('Startup Jobs response exceeded the 2 MB limit.');
			}
			buffer += decoder.decode(chunk.value, { stream: true });
			if (isSse) {
				const blocks = buffer.split(/\r?\n\r?\n/);
				buffer = blocks.pop() ?? '';
				for (const block of blocks) {
					const parsed = event(block);
					if (parsed) return parsed;
				}
			}
		}
		buffer += decoder.decode();
		const parsed = isSse ? event(buffer) : parseJson(buffer);
		if (!parsed || parsed.id !== id) throw new Error('Startup Jobs returned an unexpected response.');
		return parsed;
	} finally {
		await reader.cancel().catch(() => undefined);
		reader.releaseLock();
	}
}

async function rpc(method: string, params: Data | undefined, client: Client, notification = false): Promise<Data> {
	const id = notification ? undefined : nextId++;
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		accept: 'application/json, text/event-stream',
		'mcp-protocol-version': '2025-03-26',
		'user-agent': 'HighMatch-JobAssistant/0.1'
	};
	if (client.sessionId) headers['mcp-session-id'] = client.sessionId;
	const response = await fetch(ENDPOINT, {
		method: 'POST',
		headers,
		body: JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method, ...(params ? { params } : {}) }),
		redirect: 'error',
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	if (!response.ok) {
		await response.body?.cancel();
		if (response.status === 404) clientPromise = null;
		if (response.status === 429) throw new Error('Startup Jobs rate limit reached. Try again in a minute.');
		throw new Error(`Startup Jobs returned HTTP ${response.status}.`);
	}
	const sessionId = response.headers.get('mcp-session-id');
	if (sessionId && /^[\x21-\x7e]{1,256}$/.test(sessionId)) client.sessionId = sessionId;
	if (id === undefined) {
		await response.body?.cancel();
		return {};
	}
	const data = await readRpc(response, id);
	if (data.error || !record(data.result)) throw new Error('Startup Jobs could not complete the request.');
	return record(data.result)!;
}

async function client(): Promise<Client> {
	if (!clientPromise) {
		clientPromise = (async () => {
			const current: Client = { sessionId: null };
			await rpc('initialize', {
				protocolVersion: '2025-03-26',
				capabilities: {},
				clientInfo: { name: 'high-match-job-assistant', version: '0.1.0' }
			}, current);
			await rpc('notifications/initialized', undefined, current, true);
			return current;
		})().catch((error) => {
			clientPromise = null;
			throw error;
		});
	}
	return clientPromise;
}

async function callTool(name: ReadTool, args: Data): Promise<Data> {
	const result = await rpc('tools/call', { name, arguments: args }, await client());
	if (result.isError) throw new Error('Startup Jobs could not complete the lookup.');
	const structured = record(result.structuredContent);
	if (structured) return structured;
	if (Array.isArray(result.content)) {
		for (const item of result.content) {
			const block = record(item);
			if (block?.type === 'text' && typeof block.text === 'string') return parseJson(block.text);
		}
	}
	throw new Error('Startup Jobs returned no readable listing data.');
}

function normalizeJob(value: unknown): StartupJob | null {
	const job = record(value);
	const employer = record(job?.company);
	if (!job || !employer) return null;
	const listingUrl = httpsUrl(job.url);
	if (!listingUrl || !['startup.jobs', 'www.startup.jobs'].includes(new URL(listingUrl).hostname)) return null;
	if (new URL(listingUrl).pathname === '/') return null;
	const title = text(job.title, 300);
	const company = text(employer.name, 200);
	const companySlug = typeof employer.slug === 'string' && /^[a-z0-9][a-z0-9_-]{0,179}$/i.test(employer.slug)
		? employer.slug : '';
	if (!title || !company || !companySlug) return null;
	const place = record(job.location);
	const location = place
		? [...new Set([place.city, place.state, place.country].map((part) => text(part, 100)).filter(Boolean))].join(', ')
		: text(job.location, 240);
	return {
		company,
		companySlug,
		companyWebsite: httpsUrl(employer.website_url),
		title,
		description: text(job.description, 60_000),
		location,
		remote: job.workplace_type === 'remote',
		listingUrl,
		// The public API exposes its own listing, not a verified upstream application URL.
		employerUrl: null,
		postedAt: date(job.published_at),
		listedSalary: text(job.salary, 400) || null,
		expiresAt: date(job.expires_at)
	};
}

function rows(data: Data): unknown[] {
	if (!Array.isArray(data.jobs)) throw new Error('Startup Jobs returned no readable job list.');
	return data.jobs.slice(0, MAX_JOBS);
}

function isCurrent(job: StartupJob, now: number): boolean {
	return (!job.postedAt || Date.parse(job.postedAt) <= now)
		&& (!job.expiresAt || Date.parse(job.expiresAt) > now);
}

function normalized(rows: unknown[]): StartupJob[] {
	const now = Date.now();
	const jobs = rows.map(normalizeJob).filter((job): job is StartupJob => job !== null && isCurrent(job, now));
	return [...new Map(jobs.map((job) => [job.listingUrl, job])).values()];
}

function total(data: Data): number | null {
	return typeof data.total_count === 'number' && Number.isSafeInteger(data.total_count) && data.total_count >= 0
		? data.total_count : null;
}

export async function searchStartupJobs(query: string, country: string): Promise<StartupSearchResult> {
	const q = query.trim().slice(0, 200);
	if (!q) return { jobs: [], total: 0 };
	const region = countryCode(country);
	if (country.trim() && !region) {
		throw new Error('Startup Jobs could not recognize this country. Use a country name or a two-letter country code.');
	}
	const data = await callTool('search_jobs', { q, workplace_type: 'remote', ...(region ? { country: region } : {}), limit: MAX_JOBS });
	const summaries = rows(data);
	const details = summaries.filter((item) => {
		const job = record(item);
		const normalizedJob = normalizeJob(item);
		return normalizedJob && isCurrent(normalizedJob, Date.now()) && !text(job?.description, 60_000)
			&& Number.isSafeInteger(job?.id) && Number(job?.id) > 0;
	}).slice(0, MAX_DETAILS);
	const enriched = new Map<unknown, unknown>();
	await Promise.all(details.map(async (summary) => {
		const id = record(summary)!.id;
		try {
			const response = await callTool('get_job', { id });
			const detail = record(response.job);
			const original = normalizeJob(summary);
			const full = normalizeJob(detail);
			if (detail?.id === id && full && original && full.companySlug === original.companySlug && full.listingUrl === original.listingUrl) {
				enriched.set(id, { ...record(summary), ...detail });
			}
		} catch {
			// Partial detail outages must not erase already-discovered, attributed listings.
		}
	}));
	return { jobs: normalized(summaries.map((summary) => enriched.get(record(summary)?.id) ?? summary)), total: total(data) };
}

export async function findStartupCompanyJobs(company: string): Promise<StartupSearchResult> {
	const q = company.trim().slice(0, 200);
	const key = companyKey(q);
	if (!key) return { jobs: [], total: 0 };
	const data = await callTool('search_jobs', { q, limit: MAX_JOBS });
	const matches = normalized(rows(data)).filter((job) => companyKey(job.company) === key);
	if (!matches.length) return { jobs: [], total: 0 };
	const slugs = new Set(matches.map((job) => job.companySlug));
	if (slugs.size !== 1) throw new AmbiguousCompanyError();
	try {
		const companyJobs = await callTool('get_company_jobs', { slug: matches[0].companySlug, limit: MAX_JOBS });
		const jobs = normalized(rows(companyJobs)).filter((job) => companyKey(job.company) === key && slugs.has(job.companySlug));
		return { jobs, total: total(companyJobs) };
	} catch {
		return { jobs: matches, total: null };
	}
}
