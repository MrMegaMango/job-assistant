import { randomUUID } from 'node:crypto';
import type { Handle } from '@sveltejs/kit';
import {
	ACCOUNT_PROFILE_COOKIE,
	getSelectedSavedMatchProfile,
	loadSavedMatchProfiles
} from '$lib/server/account-profile';
import { createSupabaseServerClient, hasSupabaseAuthCookie } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.requestId = randomUUID();
	event.locals.supabase = createSupabaseServerClient(event.cookies);
	event.locals.user = null;
	event.locals.savedMatchProfiles = [];
	event.locals.savedMatchProfile = null;
	event.locals.savedMatchProfileUnavailable = false;

	const hasAuthCookie = hasSupabaseAuthCookie(event.cookies);
	if (event.locals.supabase && hasAuthCookie) {
		const { data, error } = await event.locals.supabase.auth.getUser();
		if (!error && data.user) {
			event.locals.user = { id: data.user.id };
			try {
				event.locals.savedMatchProfiles = await loadSavedMatchProfiles(
					event.locals.supabase,
					data.user.id
				);
				event.locals.savedMatchProfile = getSelectedSavedMatchProfile(
					event.locals.savedMatchProfiles,
					event.cookies.get(ACCOUNT_PROFILE_COOKIE)
				);
			} catch {
				event.locals.savedMatchProfileUnavailable = true;
			}
		}
	}
	const response = await resolve(event);
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('x-frame-options', 'DENY');
	// `no-referrer` makes Chromium serialize the Origin header as `null` for native
	// form POSTs. `same-origin` keeps same-origin CSRF validation working while still
	// withholding referrers from employer and policy links on other origins.
	response.headers.set('referrer-policy', 'same-origin');
	response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
	if (hasAuthCookie || event.url.pathname.startsWith('/auth/')) {
		response.headers.set('cache-control', 'private, no-store');
	}
	return response;
};
