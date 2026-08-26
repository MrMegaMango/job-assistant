import { describe, expect, it } from 'vitest';
import type { CandidateProfile } from '$lib/types';
import { TAILORED_MATCH_PROFILE, toHostedDemoProfile, toPublicMatchProfile } from './profile';

const stored: CandidateProfile = {
	id: 1,
	name: 'Private Candidate',
	email: 'private@example.test',
	phone: '+1 555 0100',
	resumePath: '/private/resume.pdf',
	targetTitles: ['Private target'],
	skills: ['Private skill'],
	focusAreas: ['Private focus'],
	preferredLocations: ['Private location'],
	remotePreference: 'remote',
	minBaseSalary: 999_999,
	excludedKeywords: ['Private exclusion'],
	updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('hosted tailored profile', () => {
	it('redacts identity and resume data while applying verified match criteria', () => {
		const hosted = toHostedDemoProfile(stored);
		expect(hosted).toMatchObject({ name: '', email: '', phone: '', resumePath: '' });
		expect(hosted.targetTitles).toEqual(TAILORED_MATCH_PROFILE.targetTitles);
		expect(hosted.skills).toEqual(TAILORED_MATCH_PROFILE.skills);
		expect(hosted.focusAreas).toEqual(TAILORED_MATCH_PROFILE.focusAreas);
		expect(JSON.stringify(hosted)).not.toContain('Private');
	});

	it('serializes only matching criteria for public pages', () => {
		const publicProfile = toPublicMatchProfile(stored);
		expect(publicProfile.targetTitles).toEqual(stored.targetTitles);
		expect(publicProfile).not.toHaveProperty('name');
		expect(publicProfile).not.toHaveProperty('email');
		expect(publicProfile).not.toHaveProperty('phone');
		expect(publicProfile).not.toHaveProperty('resumePath');
		expect(publicProfile).not.toHaveProperty('excludedKeywords');
		expect(publicProfile).not.toHaveProperty('minBaseSalary');
	});
});
