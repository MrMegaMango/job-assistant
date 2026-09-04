import { describe, expect, it } from 'vitest';
import {
	getSelectedSavedMatchProfile,
	savedMatchProfileInputSchema,
	savedMatchProfileSchema
} from './account-profile';
import type { SavedMatchProfile } from './profile';

const validProfile = {
	targetTitles: ['Staff Platform Engineer'],
	skills: ['Go', 'Kubernetes'],
	focusAreas: ['distributed systems'],
	preferredLocations: ['United States'],
	remotePreference: 'remote_preferred' as const,
	minBaseSalary: null,
	excludedKeywords: []
};

describe('savedMatchProfileSchema', () => {
	it('accepts non-identifying matching preferences', () => {
		expect(savedMatchProfileSchema.parse(validProfile)).toEqual(validProfile);
	});

	it('requires evidence-bearing titles, skills, and focus areas', () => {
		expect(() => savedMatchProfileSchema.parse({ ...validProfile, skills: [] })).toThrow();
		expect(() => savedMatchProfileSchema.parse({ ...validProfile, targetTitles: [] })).toThrow();
		expect(() => savedMatchProfileSchema.parse({ ...validProfile, focusAreas: [] })).toThrow();
	});

	it('rejects unsupported work-location preferences and negative salary floors', () => {
		expect(() =>
			savedMatchProfileSchema.parse({ ...validProfile, remotePreference: 'office_only' })
		).toThrow();
		expect(() => savedMatchProfileSchema.parse({ ...validProfile, minBaseSalary: -1 })).toThrow();
	});

	it('validates names and optional profile ids for saved records', () => {
		expect(
			savedMatchProfileInputSchema.parse({
				...validProfile,
				name: ' Async IC (OE) ',
				profileId: '00000000-0000-4000-8000-000000000001'
			})
		).toMatchObject({ name: 'Async IC (OE)' });
		expect(() =>
			savedMatchProfileInputSchema.parse({ ...validProfile, name: '   ' })
		).toThrow();
	});

	it('selects a requested profile and safely falls back to the first saved profile', () => {
		const makeProfile = (id: string, name: string): SavedMatchProfile => ({
			...validProfile,
			id,
			name,
			updatedAt: '2026-09-04T00:00:00.000Z'
		});
		const primary = makeProfile('00000000-0000-4000-8000-000000000001', 'Primary');
		const asyncProfile = makeProfile('00000000-0000-4000-8000-000000000002', 'Async IC (OE)');

		expect(getSelectedSavedMatchProfile([primary, asyncProfile], asyncProfile.id)).toBe(
			asyncProfile
		);
		expect(getSelectedSavedMatchProfile([primary, asyncProfile], 'missing')).toBe(primary);
		expect(getSelectedSavedMatchProfile([], undefined)).toBeNull();
	});
});
