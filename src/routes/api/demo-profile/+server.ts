import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isHostedDemo } from '$lib/server/deployment';
import { DEMO_PROFILE_COOKIE, isDemoProfileId } from '$lib/server/profile';

function safeReturnPath(value: FormDataEntryValue | null): string {
	const path = typeof value === 'string' ? value : '/';
	return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && !/[\r\n]/.test(path)
		? path
		: '/';
}

export const POST: RequestHandler = async ({ cookies, request, url }) => {
	if (!isHostedDemo()) throw error(404, 'Not found.');
	const data = await request.formData();
	const profileId = String(data.get('profileId') ?? '');
	if (!isDemoProfileId(profileId)) throw error(400, 'Choose a valid anonymous profile.');

	cookies.set(DEMO_PROFILE_COOKIE, profileId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 365
	});
	throw redirect(303, safeReturnPath(data.get('returnTo')));
};
