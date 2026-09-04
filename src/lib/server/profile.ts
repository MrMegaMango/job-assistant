import type { CandidateProfile } from '$lib/types';

type MatchProfileCriteria = Pick<
	CandidateProfile,
	| 'targetTitles'
	| 'skills'
	| 'focusAreas'
	| 'preferredLocations'
	| 'remotePreference'
	| 'minBaseSalary'
	| 'excludedKeywords'
>;

export type DemoProfileId =
	| 'staff-ai-infra'
	| 'backend-platform'
	| 'applied-ml-data'
	| 'product-full-stack';

export interface DemoProfileDefinition {
	id: DemoProfileId;
	label: string;
	headline: string;
	description: string;
	criteria: MatchProfileCriteria;
	updatedAt: string;
}

export type DemoProfileSummary = Pick<
	DemoProfileDefinition,
	'id' | 'label' | 'headline' | 'description'
>;

export const DEMO_PROFILE_COOKIE = 'high_match_demo_profile';
export const DEFAULT_DEMO_PROFILE_ID: DemoProfileId = 'staff-ai-infra';

export const DEMO_MATCH_PROFILES: Record<DemoProfileId, DemoProfileDefinition> = {
	'staff-ai-infra': {
		id: 'staff-ai-infra',
		label: 'Staff AI infrastructure',
		headline: 'Staff AI and backend infrastructure engineer',
		description: 'Model serving, retrieval, evaluation, distributed systems, and cloud platforms.',
		criteria: {
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
			remotePreference: 'remote_preferred',
			minBaseSalary: null,
			excludedKeywords: []
		},
		updatedAt: '2026-06-01T00:00:00.000Z'
	},
	'backend-platform': {
		id: 'backend-platform',
		label: 'Backend and platform',
		headline: 'Staff backend and platform engineer',
		description: 'APIs, distributed services, developer platforms, reliability, and cloud infrastructure.',
		criteria: {
			targetTitles: [
				'Staff Backend Engineer',
				'Staff Platform Engineer',
				'Staff Software Engineer Infrastructure',
				'Staff Distributed Systems Engineer',
				'Principal Software Engineer',
				'Senior Platform Engineer'
			],
			skills: [
				'Go',
				'Java',
				'Python',
				'TypeScript',
				'SQL',
				'gRPC',
				'GraphQL',
				'REST',
				'AWS',
				'GCP',
				'Kubernetes',
				'Terraform',
				'Docker',
				'Postgres',
				'Redis',
				'Kafka',
				'microservices',
				'distributed systems',
				'system design',
				'observability',
				'OpenTelemetry',
				'CI/CD',
				'cloud security',
				'performance engineering',
				'technical leadership'
			],
			focusAreas: [
				'backend infrastructure',
				'platform engineering',
				'developer platforms',
				'distributed systems',
				'APIs and services',
				'site reliability',
				'cloud security',
				'performance engineering'
			],
			preferredLocations: ['United States', 'California', 'Remote'],
			remotePreference: 'remote_preferred',
			minBaseSalary: null,
			excludedKeywords: []
		},
		updatedAt: '2026-06-02T00:00:00.000Z'
	},
	'applied-ml-data': {
		id: 'applied-ml-data',
		label: 'Applied ML and data',
		headline: 'Senior applied machine-learning and data engineer',
		description: 'Applied ML, data platforms, experimentation, model operations, and evaluation.',
		criteria: {
			targetTitles: [
				'Staff Machine Learning Engineer',
				'Senior Machine Learning Engineer',
				'Applied AI Engineer',
				'ML Platform Engineer',
				'Data Platform Engineer',
				'Applied Scientist'
			],
			skills: [
				'Python',
				'SQL',
				'PyTorch',
				'TensorFlow',
				'scikit-learn',
				'pandas',
				'Spark',
				'Airflow',
				'dbt',
				'Kafka',
				'AWS',
				'GCP',
				'Kubernetes',
				'feature stores',
				'MLOps',
				'model evaluation',
				'RAG',
				'LLM inference',
				'embeddings',
				'data pipelines',
				'experimentation',
				'system design'
			],
			focusAreas: [
				'applied machine learning',
				'ML platforms',
				'data engineering',
				'model serving',
				'RAG and retrieval',
				'evaluation systems',
				'experimentation',
				'data quality'
			],
			preferredLocations: ['United States', 'California', 'Remote'],
			remotePreference: 'remote_preferred',
			minBaseSalary: null,
			excludedKeywords: []
		},
		updatedAt: '2026-06-03T00:00:00.000Z'
	},
	'product-full-stack': {
		id: 'product-full-stack',
		label: 'Product and full-stack',
		headline: 'Senior product and full-stack engineer',
		description: 'Customer-facing products, web applications, APIs, and developer tools.',
		criteria: {
			targetTitles: [
				'Staff Software Engineer',
				'Senior Software Engineer',
				'Product Engineer',
				'Full Stack Engineer',
				'Backend Engineer',
				'Developer Experience Engineer'
			],
			skills: [
				'TypeScript',
				'JavaScript',
				'React',
				'Node.js',
				'Python',
				'SQL',
				'GraphQL',
				'REST',
				'Postgres',
				'Redis',
				'AWS',
				'GCP',
				'Docker',
				'Kubernetes',
				'Next.js',
				'Svelte',
				'web performance',
				'accessibility',
				'design systems',
				'API design',
				'system design',
				'technical leadership'
			],
			focusAreas: [
				'product engineering',
				'full-stack applications',
				'developer tools',
				'backend services',
				'APIs and integrations',
				'web performance',
				'design systems',
				'platform engineering'
			],
			preferredLocations: ['United States', 'California', 'Remote'],
			remotePreference: 'remote_preferred',
			minBaseSalary: null,
			excludedKeywords: []
		},
		updatedAt: '2026-06-04T00:00:00.000Z'
	}
};

export const TAILORED_PROFILE_HEADLINE = DEMO_MATCH_PROFILES[DEFAULT_DEMO_PROFILE_ID].headline;
export const TAILORED_MATCH_PROFILE = DEMO_MATCH_PROFILES[DEFAULT_DEMO_PROFILE_ID].criteria;

export type PublicMatchProfile = Pick<
	CandidateProfile,
	'targetTitles' | 'skills' | 'focusAreas' | 'preferredLocations' | 'remotePreference'
>;

export function isDemoProfileId(value: string | undefined): value is DemoProfileId {
	return Boolean(value && Object.hasOwn(DEMO_MATCH_PROFILES, value));
}

export function getSelectedDemoProfileId(value: string | undefined): DemoProfileId {
	return isDemoProfileId(value) ? value : DEFAULT_DEMO_PROFILE_ID;
}

export function getDemoProfile(profileId: DemoProfileId): DemoProfileDefinition {
	return DEMO_MATCH_PROFILES[profileId];
}

export function listDemoProfiles(): DemoProfileDefinition[] {
	return Object.values(DEMO_MATCH_PROFILES);
}

export function toDemoProfileSummary(profile: DemoProfileDefinition): DemoProfileSummary {
	const { id, label, headline, description } = profile;
	return { id, label, headline, description };
}

export function toPublicMatchProfile(profile: CandidateProfile): PublicMatchProfile {
	return {
		targetTitles: [...profile.targetTitles],
		skills: [...profile.skills],
		focusAreas: [...profile.focusAreas],
		preferredLocations: [...profile.preferredLocations],
		remotePreference: profile.remotePreference
	};
}

export function toHostedDemoProfile(
	stored: CandidateProfile,
	profileId: DemoProfileId = DEFAULT_DEMO_PROFILE_ID
): CandidateProfile {
	const selected = getDemoProfile(profileId);
	return {
		...stored,
		name: '',
		email: '',
		phone: '',
		resumePath: '',
		targetTitles: [...selected.criteria.targetTitles],
		skills: [...selected.criteria.skills],
		focusAreas: [...selected.criteria.focusAreas],
		preferredLocations: [...selected.criteria.preferredLocations],
		remotePreference: selected.criteria.remotePreference,
		minBaseSalary: selected.criteria.minBaseSalary,
		excludedKeywords: [...selected.criteria.excludedKeywords],
		updatedAt: selected.updatedAt
	};
}
