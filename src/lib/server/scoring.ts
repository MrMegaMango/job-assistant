import type { CandidateProfile, MatchComponents, MatchResult, NormalizedJob } from '$lib/types';
import { normalizeSearchText } from './text';

type AliasGroup = readonly [canonical: string, aliases: readonly string[]];

const SKILL_ALIASES: readonly AliasGroup[] = [
	['Go', ['go', 'golang']],
	['gRPC', ['grpc', 'google remote procedure call']],
	['GraphQL', ['graphql']],
	['GCP', ['gcp', 'google cloud', 'google cloud platform']],
	['AWS', ['aws', 'amazon web services']],
	['Kubernetes', ['kubernetes', 'k8s']],
	['Vertex AI', ['vertex ai', 'vertexai']],
	['vLLM', ['vllm']],
	['Claude', ['claude', 'anthropic models']],
	['MongoDB', ['mongodb', 'mongo db']],
	['Postgres', ['postgres', 'postgresql']],
	['OpenTelemetry', ['opentelemetry', 'open telemetry', 'otel']],
	['TensorRT', ['tensorrt', 'tensor rt']],
	['RAG', ['rag', 'retrieval augmented generation']],
	['LLM evaluation', ['llm evaluation', 'model evaluation', 'eval harness', 'evals']],
	['LLM inference', ['llm inference', 'model inference', 'model serving', 'inference infrastructure']],
	['distributed systems', ['distributed systems', 'distributed system']],
	['microservices', ['microservices', 'microservice architecture']],
	['CI/CD', ['ci cd', 'continuous integration', 'continuous delivery', 'continuous deployment']],
	['cloud security', ['cloud security', 'service authentication', 'zero trust']],
	['performance engineering', ['performance engineering', 'performance optimization', 'latency optimization']],
	['system design', ['system design', 'systems design']],
	['technical leadership', ['technical leadership', 'tech lead', 'team lead']]
];

const FOCUS_ALIASES: readonly AliasGroup[] = [
	['AI infrastructure', ['ai infrastructure', 'ml infrastructure', 'machine learning infrastructure', 'generative ai platform']],
	['LLM inference', ['llm inference', 'model inference', 'inference infrastructure', 'inference optimization', 'inference engine']],
	['model serving', ['model serving', 'serving platform', 'inference serving', 'model platform']],
	['RAG and retrieval', ['rag', 'retrieval augmented generation', 'semantic search', 'vector search', 'retrieval pipeline']],
	['evaluation systems', ['evaluation system', 'evaluation framework', 'eval harness', 'llm eval', 'model evaluation']],
	['backend infrastructure', ['backend infrastructure', 'backend platform', 'backend systems', 'api platform', 'service infrastructure']],
	['platform engineering', ['platform engineering', 'developer platform', 'internal platform', 'infrastructure platform', 'paas']],
	['distributed systems', ['distributed systems', 'distributed system']],
	['performance engineering', ['performance engineering', 'performance optimization', 'low latency', 'throughput', 'scalability']],
	['cloud security', ['cloud security', 'authentication', 'authorization', 'identity and access', 'zero trust']],
	['asynchronous collaboration', ['asynchronous collaboration', 'async first', 'async work', 'asynchronous work']],
	['backend services', ['backend services', 'backend service', 'backend development', 'server side', 'service development']],
	['internal tools', ['internal tools', 'internal applications', 'business systems']],
	['developer tools', ['developer tools', 'developer tooling', 'developer experience', 'devex']],
	['APIs and integrations', ['api integration', 'api development', 'third party integration', 'integrations']],
	['maintenance and modernization', ['modernization', 'legacy system', 'brownfield', 'application maintenance']],
	['documentation-driven engineering', ['documentation driven', 'documentation first', 'design docs', 'technical documentation']]
];

const LOCATION_ALIASES: readonly AliasGroup[] = [
	['United States', ['united states', 'united states of america', 'usa', 'u.s.', 'us']],
	['California', ['california', 'ca']]
];

function padded(value: string): string {
	return ` ${normalizeSearchText(value)} `;
}

function containsPhrase(normalizedText: string, phrase: string): boolean {
	const normalizedPhrase = normalizeSearchText(phrase);
	if (normalizedPhrase.length === 0) return false;
	const escapedPhrase = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(?:^|[^a-z0-9])${escapedPhrase}(?=$|[^a-z0-9])`).test(normalizedText);
}

function canonicalTitle(value: string): string {
	return normalizeSearchText(value)
		.replace(/\bstaff\+/g, 'staff')
		.replace(/\bmts\b/g, 'member of technical staff')
		.replace(/\bsr\b/g, 'senior')
		.replace(/\bml\b/g, 'machine learning')
		.replace(/\bai\b/g, 'artificial intelligence');
}

function titleTokens(value: string): Set<string> {
	return new Set(canonicalTitle(value).split(' ').filter((token) => token.length > 1));
}

function overlapScore(target: string, title: string): number {
	const expected = titleTokens(target);
	const actual = titleTokens(title);
	if (expected.size === 0 || actual.size === 0) return 0;
	const intersection = [...expected].filter((token) => actual.has(token)).length;
	const recall = intersection / expected.size;
	const precision = intersection / actual.size;
	const f1 = recall + precision === 0 ? 0 : (2 * recall * precision) / (recall + precision);
	return recall * 0.75 + f1 * 0.25;
}

function aliasesFor(value: string, groups: readonly AliasGroup[]): readonly string[] {
	const normalized = normalizeSearchText(value);
	const group = groups.find(([canonical]) => normalizeSearchText(canonical) === normalized);
	return group?.[1] ?? [value];
}

function configuredMatches(values: string[], groups: readonly AliasGroup[], haystack: string): string[] {
	return values.filter((value) => aliasesFor(value, groups).some((alias) => containsPhrase(haystack, alias)));
}

function hasAnyPhrase(haystack: string, phrases: string[]): boolean {
	return phrases.some((phrase) => containsPhrase(haystack, phrase));
}

function seniorityLevel(value: string): number {
	const title = canonicalTitle(value);
	if (hasAnyPhrase(title, ['intern', 'internship', 'junior', 'new grad', 'entry level'])) return 0;
	if (containsPhrase(title, 'principal')) return 4;
	if (hasAnyPhrase(title, ['staff', 'member of technical staff', 'lead'])) return 3;
	if (containsPhrase(title, 'senior')) return 2;
	return 1;
}

function seniorityFit(desired: number, actual: number): number {
	if (actual === desired) return 15;
	if (actual === 0 && desired > 0) return 0;
	if (actual === desired + 1) return 12;
	if (actual === desired - 1) return 10;
	return actual > desired ? 8 : 6;
}

function rounded(value: number): number {
	return Math.round(value * 10) / 10;
}

export function scoreJob(profile: CandidateProfile, job: NormalizedJob): MatchResult {
	const haystack = normalizeSearchText(`${job.title}\n${job.description}`);
	const titleText = canonicalTitle(job.title);
	const matchedSkills = configuredMatches(profile.skills, SKILL_ALIASES, haystack);
	const matchedFocusAreas = configuredMatches(profile.focusAreas, FOCUS_ALIASES, haystack);
	const excluded = profile.excludedKeywords.filter((keyword) => containsPhrase(haystack, keyword));
	const remoteMismatch = profile.remotePreference === 'remote' && !job.remote;
	const remotePreferenceGap = profile.remotePreference === 'remote_preferred' && !job.remote;
	const annualUsdSalary =
		job.salary?.period === 'year' && job.salary.currency.toUpperCase() === 'USD' ? job.salary : null;
	const payMismatch =
		profile.minBaseSalary !== null &&
		annualUsdSalary !== null &&
		annualUsdSalary.max < profile.minBaseSalary;
	const hardRejected = excluded.length > 0 || remoteMismatch || payMismatch;

	const targetScores = profile.targetTitles.map((target) => {
		const targetTitle = canonicalTitle(target);
		let score = padded(canonicalTitle(job.title)).includes(padded(targetTitle))
			? 1
			: overlapScore(target, job.title);
		if (targetTitle === 'member of technical staff') score = Math.min(score, 0.35);
		return { target, score };
	});
	const bestTarget = targetScores.sort((a, b) => b.score - a.score)[0] ?? { target: '', score: 0 };
	const configuredSeniority = profile.targetTitles.map(seniorityLevel);
	const desiredSeniority = configuredSeniority.length > 0 ? Math.max(...configuredSeniority) : 1;
	const actualSeniority = seniorityLevel(job.title);
	const earlyCareer = actualSeniority === 0;
	const earlyCareerMismatch = earlyCareer && desiredSeniority > 0;
	const frontendOnly =
		hasAnyPhrase(titleText, ['frontend', 'front end', 'ui engineer']) &&
		!hasAnyPhrase(titleText, ['full stack', 'fullstack', 'backend']);
	const wantsFrontend = profile.targetTitles.some((target) =>
		hasAnyPhrase(canonicalTitle(target), ['frontend', 'front end', 'ui engineer'])
	);
	const peopleManager = hasAnyPhrase(titleText, [
		'engineering manager',
		'director of engineering',
		'head of engineering',
		'vice president engineering'
	]);
	const wantsPeopleManager = profile.targetTitles.some((target) =>
		hasAnyPhrase(canonicalTitle(target), [
			'engineering manager',
			'director of engineering',
			'head of engineering'
		])
	);
	const frontendMismatch = frontendOnly && !wantsFrontend;
	const peopleManagerMismatch = peopleManager && !wantsPeopleManager;
	const rolePenalty = earlyCareerMismatch ? 15 : frontendMismatch ? 10 : peopleManagerMismatch ? 8 : 0;
	const title = rounded(Math.max(0, Math.min(25, bestTarget.score * 25) - rolePenalty));

	const skills = rounded(Math.min(30, matchedSkills.length * 3.75));
	const domain = Math.min(15, matchedFocusAreas.length * 3);
	const seniority = seniorityFit(desiredSeniority, actualSeniority);

	const locationText = normalizeSearchText(job.location);
	const preferredLocation = profile.preferredLocations.find((location) =>
		aliasesFor(location, LOCATION_ALIASES).some((alias) => containsPhrase(locationText, alias))
	);
	const genericRemoteLocation =
		!locationText ||
		hasAnyPhrase(locationText, ['worldwide', 'anywhere', 'global']) ||
		locationText.replace(/\b(remote|distributed|work from home)\b/g, ' ').trim().length === 0;
	const regionLimitedRemote = job.remote && !preferredLocation && !genericRemoteLocation;
	let location: number;
	if (job.remote) {
		const prioritizesRemote =
			profile.remotePreference === 'remote' || profile.remotePreference === 'remote_preferred';
		location = regionLimitedRemote ? 3 : prioritizesRemote ? 10 : 8;
	} else if (profile.remotePreference === 'remote_preferred') {
		location = preferredLocation ? 7 : 2;
	} else if (preferredLocation) {
		location = 10;
	} else {
		location = profile.remotePreference === 'any' ? 4 : 0;
	}

	let compensation = 1.5;
	if (annualUsdSalary) {
		if (profile.minBaseSalary === null) compensation = 3.5;
		else if (annualUsdSalary.min >= profile.minBaseSalary) compensation = 5;
		else if (annualUsdSalary.max >= profile.minBaseSalary) compensation = 3.5;
		else compensation = 0;
	} else if (job.salary) {
		compensation = 2.5;
	}

	const components: MatchComponents = { title, skills, domain, seniority, location, compensation };
	const rawScore = Object.values(components).reduce((sum, value) => sum + value, 0);
	const score = hardRejected ? 0 : Math.min(100, Math.round(rawScore));

	const strengths: string[] = [];
	const gaps: string[] = [];
	const unknowns: string[] = [];
	if (bestTarget.score >= 0.55) strengths.push(`Title aligns with “${bestTarget.target}”.`);
	else gaps.push('Title alignment with your target roles is limited.');
	if (matchedSkills.length > 0) {
		strengths.push(`Posting evidence matches verified skills: ${matchedSkills.slice(0, 8).join(', ')}.`);
	} else {
		gaps.push('No configured skill phrases were found in the posting.');
	}
	if (matchedFocusAreas.length > 0) {
		strengths.push(`Preferred focus matches: ${matchedFocusAreas.slice(0, 5).join(', ')}.`);
	} else {
		gaps.push('No preferred focus-area phrases were found in the posting.');
	}
	if (earlyCareerMismatch) gaps.push('The title is aimed at interns, new graduates, or junior candidates.');
	if (frontendMismatch) gaps.push('The title is frontend-focused while the profile prioritizes backend and infrastructure work.');
	if (peopleManagerMismatch) gaps.push('The title is people-management focused while the profile prioritizes staff-level IC work.');
	if (job.remote) strengths.push('Posting is marked remote.');
	else if (preferredLocation) strengths.push(`Location matches your preference: ${preferredLocation}.`);
	if (regionLimitedRemote) {
		unknowns.push(`The remote role may be region-limited: ${job.location}.`);
	}
	if (job.salary) strengths.push('Employer-posted compensation is available.');
	else unknowns.push('Employer compensation is not disclosed; any benchmark shown is only market context.');
	if (job.salary && !annualUsdSalary) {
		unknowns.push('Posted compensation is not an annual USD range, so it was not compared with the salary floor.');
	}
	if (!/visa|sponsor|work authorization|authorized to work/i.test(job.description)) {
		unknowns.push('Work-authorization or sponsorship policy is not explicit.');
	}
	if (excluded.length > 0) gaps.push(`Excluded phrase found: ${excluded.join(', ')}.`);
	if (remoteMismatch) gaps.push('Posting is not remote, but your profile requires remote work.');
	if (remotePreferenceGap) gaps.push('Posting is not remote, though your profile prefers remote work.');
	if (payMismatch) gaps.push('The posted annual USD maximum is below your configured base-salary floor.');

	let confidence = 45;
	if (job.description.length > 500) confidence += 20;
	if (job.location) confidence += 10;
	if (job.salary) confidence += 15;
	if (job.postedAt) confidence += 5;
	if (matchedSkills.length > 0) confidence += 5;
	if (matchedFocusAreas.length > 0) confidence += 5;

	return {
		score,
		confidence: Math.min(100, confidence),
		hardRejected,
		components,
		matchedSkills,
		matchedFocusAreas,
		strengths,
		gaps,
		unknowns
	};
}
