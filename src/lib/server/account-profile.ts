import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedMatchProfile } from './profile';

const trimmedList = z.array(z.string().trim().min(1).max(160)).max(80);

export const savedMatchProfileSchema = z.object({
	targetTitles: trimmedList.min(1),
	skills: trimmedList.min(1),
	focusAreas: trimmedList.min(1),
	preferredLocations: trimmedList,
	remotePreference: z.enum(['remote', 'remote_preferred', 'hybrid', 'any']),
	minBaseSalary: z.number().nonnegative().nullable(),
	excludedKeywords: trimmedList
});

type MatchProfileRow = {
	target_titles: string[];
	skills: string[];
	focus_areas: string[];
	preferred_locations: string[];
	remote_preference: SavedMatchProfile['remotePreference'];
	min_base_salary: number | null;
	excluded_keywords: string[];
	updated_at: string;
};

function fromRow(row: MatchProfileRow): SavedMatchProfile {
	return {
		targetTitles: row.target_titles,
		skills: row.skills,
		focusAreas: row.focus_areas,
		preferredLocations: row.preferred_locations,
		remotePreference: row.remote_preference,
		minBaseSalary: row.min_base_salary,
		excludedKeywords: row.excluded_keywords,
		updatedAt: row.updated_at
	};
}

const PROFILE_COLUMNS =
	'target_titles, skills, focus_areas, preferred_locations, remote_preference, min_base_salary, excluded_keywords, updated_at';

export async function loadSavedMatchProfile(
	supabase: SupabaseClient,
	userId: string
): Promise<SavedMatchProfile | null> {
	const { data, error } = await supabase
		.from('user_match_profiles')
		.select(PROFILE_COLUMNS)
		.eq('user_id', userId)
		.maybeSingle<MatchProfileRow>();
	if (error) throw error;
	return data ? fromRow(data) : null;
}

export async function saveSavedMatchProfile(
	supabase: SupabaseClient,
	userId: string,
	input: unknown
): Promise<SavedMatchProfile> {
	const profile = savedMatchProfileSchema.parse(input);
	const { data, error } = await supabase
		.from('user_match_profiles')
		.upsert(
			{
				user_id: userId,
				target_titles: profile.targetTitles,
				skills: profile.skills,
				focus_areas: profile.focusAreas,
				preferred_locations: profile.preferredLocations,
				remote_preference: profile.remotePreference,
				min_base_salary: profile.minBaseSalary,
				excluded_keywords: profile.excludedKeywords,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'user_id' }
		)
		.select(PROFILE_COLUMNS)
		.single<MatchProfileRow>();
	if (error) throw error;
	return fromRow(data);
}
