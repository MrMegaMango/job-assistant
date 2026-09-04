import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedMatchProfile } from '$lib/server/profile';

declare global {
	namespace App {
		interface Locals {
			requestId: string;
			supabase: SupabaseClient | null;
			user: { id: string } | null;
			savedMatchProfile: SavedMatchProfile | null;
			savedMatchProfileUnavailable: boolean;
		}
	}
}

export {};
