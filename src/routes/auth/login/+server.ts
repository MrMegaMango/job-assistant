import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isHostedDemo } from '$lib/server/deployment';
import { safeReturnPath } from '$lib/server/safe-return';

async function startGoogleSignIn(
	locals: App.Locals,
	url: URL,
	nextValue: FormDataEntryValue | string | null
): Promise<never> {
	if (!isHostedDemo()) throw error(404, 'Not found.');
	if (!locals.supabase) throw error(503, 'Google sign-in is not configured yet.');

	const next = safeReturnPath(nextValue);
	const callback = new URL('/auth/callback', url.origin);
	callback.searchParams.set('next', next);
	const { data: auth, error: authError } = await locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo: callback.toString() }
	});
	if (authError || !auth.url) throw error(502, 'Google sign-in could not be started.');
	throw redirect(303, auth.url);
}

export const GET: RequestHandler = async ({ locals, url }) => {
	return startGoogleSignIn(locals, url, url.searchParams.get('returnTo'));
};

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const data = await request.formData();
	return startGoogleSignIn(locals, url, data.get('returnTo'));
};
