import { env } from '$env/dynamic/public';
import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';

export function isSupabaseConfigured(): boolean {
	return Boolean(env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function createSupabaseServerClient(cookies: Cookies) {
	if (!isSupabaseConfigured()) return null;
	return createServerClient(env.PUBLIC_SUPABASE_URL!, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (values) => {
				for (const { name, value, options } of values) {
					cookies.set(name, value, { ...options, path: options.path ?? '/' });
				}
			}
		}
	});
}

export function hasSupabaseAuthCookie(cookies: Cookies): boolean {
	return cookies
		.getAll()
		.some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'));
}
