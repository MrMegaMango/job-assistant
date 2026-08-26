import type { CandidateProfile, MatchComponents, MatchResult, NormalizedJob } from '$lib/types';
import { normalizeSearchText } from './text';

function tokens(value: string): Set<string> {
	return new Set(normalizeSearchText(value).split(' ').filter((token) => token.length > 1));
}

function overlapScore(left: string, right: string): number {
	const a = tokens(left);
	const b = tokens(right);
	if (a.size === 0 || b.size === 0) return 0;
	const intersection = [...a].filter((token) => b.has(token)).length;
	return intersection / Math.max(a.size, b.size);
}

function rounded(value: number): number {
	return Math.round(value * 10) / 10;
}

export function scoreJob(profile: CandidateProfile, job: NormalizedJob): MatchResult {
	const haystack = normalizeSearchText(`${job.title}\n${job.description}`);
	const titleText = normalizeSearchText(job.title);
	const excluded = profile.excludedKeywords.filter((keyword) => haystack.includes(normalizeSearchText(keyword)));
	const remoteMismatch = profile.remotePreference === 'remote' && !job.remote;
	const payMismatch =
		profile.minBaseSalary !== null &&
		job.salary?.period === 'year' &&
		job.salary.max < profile.minBaseSalary;
	const hardRejected = excluded.length > 0 || remoteMismatch || payMismatch;

	const targetScores = profile.targetTitles.map((target) => ({
		target,
		score: titleText.includes(normalizeSearchText(target)) ? 1 : overlapScore(target, job.title)
	}));
	const bestTarget = targetScores.sort((a, b) => b.score - a.score)[0] ?? { target: '', score: 0 };
	const title = rounded(Math.min(25, bestTarget.score * 25));

	const matchedSkills = profile.skills.filter((skill) => {
		const normalized = normalizeSearchText(skill);
		return normalized.length > 0 && haystack.includes(normalized);
	});
	const skills = Math.min(35, matchedSkills.length * 5);

	const domainKeywords = [
		'ai',
		'machine learning',
		'llm',
		'infrastructure',
		'backend',
		'platform',
		'distributed systems',
		'rag',
		'evaluation',
		'performance'
	];
	const domainHits = domainKeywords.filter((keyword) => haystack.includes(normalizeSearchText(keyword)));
	const domain = Math.min(15, domainHits.length * 2.5);

	const desiredSenior = profile.targetTitles.some((target) => /staff|principal|member of technical staff|lead/i.test(target));
	const seniority = desiredSenior
		? /staff|principal|member of technical staff|\bmts\b|lead/i.test(job.title)
			? 10
			: /senior/i.test(job.title)
				? 7
				: 2
		: 5;

	const locationText = normalizeSearchText(job.location);
	const preferredLocation = profile.preferredLocations.find((location) =>
		locationText.includes(normalizeSearchText(location))
	);
	const location = job.remote
		? profile.remotePreference === 'remote'
			? 10
			: 8
		: preferredLocation
			? 10
			: profile.remotePreference === 'any'
				? 5
				: 0;

	let compensation = 3;
	if (job.salary?.period === 'year') {
		if (profile.minBaseSalary === null) compensation = 7;
		else if (job.salary.min >= profile.minBaseSalary) compensation = 10;
		else if (job.salary.max >= profile.minBaseSalary) compensation = 7;
		else compensation = 0;
	}

	const components: MatchComponents = { title, skills, domain, seniority, location, compensation };
	const rawScore = Object.values(components).reduce((sum, value) => sum + value, 0);
	const score = hardRejected ? 0 : Math.min(100, Math.round(rawScore));

	const strengths: string[] = [];
	const gaps: string[] = [];
	const unknowns: string[] = [];
	if (bestTarget.score >= 0.55) strengths.push(`Title aligns with “${bestTarget.target}”.`);
	else gaps.push('Title alignment with your target roles is limited.');
	if (matchedSkills.length > 0) strengths.push(`Verified skill matches: ${matchedSkills.slice(0, 8).join(', ')}.`);
	else gaps.push('No configured skill phrases were found in the posting.');
	if (job.remote) strengths.push('Posting is marked remote.');
	else if (preferredLocation) strengths.push(`Location matches your preference: ${preferredLocation}.`);
	if (job.salary) strengths.push('Employer-posted compensation is available.');
	else unknowns.push('Employer compensation is not disclosed; any benchmark shown is only market context.');
	if (!/visa|sponsor|work authorization|authorized to work/i.test(job.description)) {
		unknowns.push('Work-authorization or sponsorship policy is not explicit.');
	}
	if (excluded.length > 0) gaps.push(`Excluded phrase found: ${excluded.join(', ')}.`);
	if (remoteMismatch) gaps.push('Posting is not remote, but your profile requires remote work.');
	if (payMismatch) gaps.push('The posted maximum is below your configured base-salary floor.');

	let confidence = 45;
	if (job.description.length > 500) confidence += 20;
	if (job.location) confidence += 10;
	if (job.salary) confidence += 15;
	if (job.postedAt) confidence += 5;
	if (matchedSkills.length > 0) confidence += 5;

	return {
		score,
		confidence: Math.min(100, confidence),
		hardRejected,
		components,
		matchedSkills,
		strengths,
		gaps,
		unknowns
	};
}
