import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ACCOUNT_PROFILE_COOKIE } from '$lib/server/account-profile';
import { isHostedDemo } from '$lib/server/deployment';
import { safeReturnPath } from '$lib/server/safe-return';

export const POST: RequestHandler = async ({ cookies, locals, request, url }) => {
	if (!isHostedDemo()) throw error(404, 'Not found.');
	if (!locals.user) throw error(401, 'Sign in before switching profiles.');
	const data = await request.formData();
	const profileId = String(data.get('profileId') ?? '');
	if (!locals.savedMatchProfiles.some((profile) => profile.id === profileId)) {
		throw error(400, 'Choose a valid saved profile.');
	}

	cookies.set(ACCOUNT_PROFILE_COOKIE, profileId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 365
	});
	throw redirect(303, safeReturnPath(data.get('returnTo')));
};
