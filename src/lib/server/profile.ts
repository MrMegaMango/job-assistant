import type { CandidateProfile } from '$lib/types';

export const TAILORED_PROFILE_HEADLINE = 'Staff AI and backend infrastructure engineer';

export const TAILORED_MATCH_PROFILE = {
	targetTitles: [
		'Staff AI Engineer',
		'Staff AI Infrastructure Engineer',
		'Staff Backend Infrastructure Engineer',
		'Staff Software Engineer AI Platform',
		'Member of Technical Staff',
		'Staff ML Platform Engineer'
	],
	skills: [
		'Go',
		'Python',
		'gRPC',
		'GraphQL',
		'GCP',
		'AWS',
		'Kubernetes',
		'Vertex AI',
		'vLLM',
		'Claude',
		'Pinecone',
		'Arize',
		'MongoDB',
		'Grafana',
		'Postgres',
		'Redis',
		'Prometheus',
		'OpenTelemetry',
		'TensorRT',
		'RAG',
		'embeddings',
		'LLM evaluation',
		'LLM inference',
		'distributed systems',
		'microservices',
		'CI/CD',
		'cloud security',
		'performance engineering',
		'system design',
		'technical leadership'
	],
	focusAreas: [
		'AI infrastructure',
		'LLM inference',
		'model serving',
		'RAG and retrieval',
		'evaluation systems',
		'backend infrastructure',
		'platform engineering',
		'distributed systems',
		'performance engineering',
		'cloud security'
	],
	preferredLocations: ['San Diego', 'California', 'United States'],
	remotePreference: 'any',
	minBaseSalary: null,
	excludedKeywords: []
} satisfies Pick<
	CandidateProfile,
	| 'targetTitles'
	| 'skills'
	| 'focusAreas'
	| 'preferredLocations'
	| 'remotePreference'
	| 'minBaseSalary'
	| 'excludedKeywords'
>;

export type PublicMatchProfile = Pick<
	CandidateProfile,
	'targetTitles' | 'skills' | 'focusAreas' | 'preferredLocations' | 'remotePreference'
>;

export function toPublicMatchProfile(profile: CandidateProfile): PublicMatchProfile {
	return {
		targetTitles: [...profile.targetTitles],
		skills: [...profile.skills],
		focusAreas: [...profile.focusAreas],
		preferredLocations: [...profile.preferredLocations],
		remotePreference: profile.remotePreference
	};
}

export function toHostedDemoProfile(stored: CandidateProfile): CandidateProfile {
	return {
		...stored,
		name: '',
		email: '',
		phone: '',
		resumePath: '',
		targetTitles: [...TAILORED_MATCH_PROFILE.targetTitles],
		skills: [...TAILORED_MATCH_PROFILE.skills],
		focusAreas: [...TAILORED_MATCH_PROFILE.focusAreas],
		preferredLocations: [...TAILORED_MATCH_PROFILE.preferredLocations],
		remotePreference: TAILORED_MATCH_PROFILE.remotePreference,
		minBaseSalary: TAILORED_MATCH_PROFILE.minBaseSalary,
		excludedKeywords: [...TAILORED_MATCH_PROFILE.excludedKeywords],
		updatedAt: '2026-06-01T00:00:00.000Z'
	};
}
