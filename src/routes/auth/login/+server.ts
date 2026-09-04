import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isHostedDemo } from '$lib/server/deployment';
import { safeReturnPath } from '$lib/server/safe-return';

export const POST: RequestHandler = async ({ locals, request, url }) => {
	if (!isHostedDemo()) throw error(404, 'Not found.');
	if (!locals.supabase) throw error(503, 'Google sign-in is not configured yet.');

	const data = await request.formData();
	const next = safeReturnPath(data.get('returnTo'));
	const callback = new URL('/auth/callback', url.origin);
	callback.searchParams.set('next', next);
	const { data: auth, error: authError } = await locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo: callback.toString() }
	});
	if (authError || !auth.url) throw error(502, 'Google sign-in could not be started.');
	throw redirect(303, auth.url);
};
