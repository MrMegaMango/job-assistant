import { describe, expect, it } from 'vitest';
import type { CandidateProfile } from '$lib/types';
import {
	DEFAULT_DEMO_PROFILE_ID,
	DEMO_MATCH_PROFILES,
	TAILORED_MATCH_PROFILE,
	getSelectedDemoProfileId,
	isOveremploymentScreen,
	listDemoProfiles,
	toHostedDemoProfile,
	toHostedSavedProfile,
	toPublicMatchProfile
} from './profile';

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
		expect(hosted.remotePreference).toBe('remote_preferred');
		expect(JSON.stringify(hosted)).not.toContain('Private');
	});

	it('offers distinct anonymous profiles without leaking stored values', () => {
		const profiles = listDemoProfiles();
		expect(profiles).toHaveLength(5);
		expect(new Set(profiles.map((profile) => profile.updatedAt)).size).toBe(profiles.length);

		for (const profile of profiles) {
			const hosted = toHostedDemoProfile(stored, profile.id);
			expect(hosted.targetTitles).toEqual(DEMO_MATCH_PROFILES[profile.id].criteria.targetTitles);
			expect(hosted.updatedAt).toBe(profile.updatedAt);
			expect(JSON.stringify(hosted)).not.toContain('Private');
			expect(hosted).toMatchObject({ name: '', email: '', phone: '', resumePath: '' });
		}
	});

	it('offers a remote async profile with conservative visible-demand filters', () => {
		const profile = DEMO_MATCH_PROFILES['remote-async-ic'];
		expect(profile.criteria.remotePreference).toBe('remote');
		expect(profile.criteria.focusAreas).toContain('asynchronous collaboration');
		expect(profile.criteria.excludedKeywords).toEqual(
			expect.arrayContaining([
				'on-call',
				'hybrid',
				'security clearance',
				'frequent travel',
				'environment is intense'
			])
		);
		expect(isOveremploymentScreen(profile.criteria)).toBe(true);
	});

	it('falls back safely when an anonymous-profile cookie is missing or invalid', () => {
		expect(getSelectedDemoProfileId(undefined)).toBe(DEFAULT_DEMO_PROFILE_ID);
		expect(getSelectedDemoProfileId('not-a-profile')).toBe(DEFAULT_DEMO_PROFILE_ID);
		expect(getSelectedDemoProfileId('backend-platform')).toBe('backend-platform');
		expect(getSelectedDemoProfileId('remote-async-ic')).toBe('remote-async-ic');
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

	it('applies a saved account profile without exposing stored local identity', () => {
		const hosted = toHostedSavedProfile(stored, {
			id: '00000000-0000-4000-8000-000000000001',
			name: 'Platform search',
			targetTitles: ['Principal Platform Engineer'],
			skills: ['Rust'],
			focusAreas: ['developer platforms'],
			preferredLocations: ['Remote'],
			remotePreference: 'remote',
			minBaseSalary: 250_000,
			excludedKeywords: ['gambling'],
			updatedAt: '2026-09-04T00:00:00.000Z'
		});

		expect(hosted).toMatchObject({
			name: '',
			email: '',
			phone: '',
			resumePath: '',
			targetTitles: ['Principal Platform Engineer'],
			skills: ['Rust'],
			minBaseSalary: 250_000
		});
		expect(hosted.updatedAt).toMatch(/^saved:2026-09-04T00:00:00\.000Z:[a-f0-9]{64}$/);
		expect(JSON.stringify(hosted)).not.toContain('Private');
	});
});
