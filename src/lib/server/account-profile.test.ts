import { describe, expect, it } from 'vitest';
import { savedMatchProfileSchema } from './account-profile';

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
});
