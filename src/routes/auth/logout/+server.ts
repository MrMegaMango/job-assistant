import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeReturnPath } from '$lib/server/safe-return';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.supabase) throw error(404, 'Not found.');
	const data = await request.formData();
	const next = safeReturnPath(data.get('returnTo'));
	await locals.supabase.auth.signOut({ scope: 'local' });
	throw redirect(303, next);
};
