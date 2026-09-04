export type SourceProvider = 'greenhouse' | 'ashby' | 'lever';

export type RemotePreference = 'remote' | 'hybrid' | 'any';

export interface CandidateProfile {
	id: number;
	name: string;
	email: string;
	phone: string;
	resumePath: string;
	targetTitles: string[];
	skills: string[];
	focusAreas: string[];
	preferredLocations: string[];
	remotePreference: RemotePreference;
	minBaseSalary: number | null;
	excludedKeywords: string[];
	updatedAt: string;
}

export interface JobSource {
	id: number;
	provider: SourceProvider;
	name: string;
	boardToken: string;
	enabled: boolean;
	policyUrl: string;
	applyMode: 'link_only' | 'assisted';
	lastSyncedAt: string | null;
	lastError: string | null;
}

export interface SalaryRange {
	min: number;
	max: number;
	currency: string;
	period: 'year' | 'hour' | 'unknown';
	sourceType: 'employer_posted' | 'government_benchmark';
	sourceUrl: string;
	label?: string;
}

export interface NormalizedJob {
	externalId: string;
	company: string;
	title: string;
	location: string;
	remote: boolean;
	description: string;
	canonicalUrl: string;
	applyUrl: string;
	postedAt: string | null;
	updatedAt: string | null;
	salary: SalaryRange | null;
}

export interface StoredJob extends NormalizedJob {
	id: number;
	sourceId: number;
	sourceProvider: SourceProvider;
	sourceName: string;
	contentHash: string;
	firstSeenAt: string;
	lastSeenAt: string;
	isActive: boolean;
}

export interface ListingAge {
	days: number;
	label: string;
	postedAt: string;
}

export interface MatchComponents {
	title: number;
	skills: number;
	domain: number;
	seniority: number;
	location: number;
	compensation: number;
}

export interface MatchResult {
	score: number;
	confidence: number;
	hardRejected: boolean;
	components: MatchComponents;
	matchedSkills: string[];
	matchedFocusAreas: string[];
	strengths: string[];
	gaps: string[];
	unknowns: string[];
}

export interface RankedJob extends StoredJob {
	match: MatchResult;
	listingAge: ListingAge | null;
	applicationState: ApplicationState | null;
}

export type ApplicationState =
	| 'SHORTLISTED'
	| 'NEEDS_INPUT'
	| 'READY_FOR_REVIEW'
	| 'APPROVED_TO_OPEN'
	| 'OPENED'
	| 'SUBMITTED'
	| 'WITHDRAWN';

export interface ApplicationPacket {
	jobId: number;
	createdAt: string;
	resumePath: string;
	contactReady: boolean;
	verifiedStrengths: string[];
	gaps: string[];
	unknowns: string[];
	checklist: string[];
	draftNote: string;
}

export interface ApplicationRecord {
	id: number;
	jobId: number;
	state: ApplicationState;
	packet: ApplicationPacket | null;
	packetHash: string | null;
	confirmationId: string | null;
	createdAt: string;
	updatedAt: string;
}
