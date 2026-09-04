import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeReturnPath } from '$lib/server/safe-return';

export const GET: RequestHandler = async ({ locals, url }) => {
	const code = url.searchParams.get('code');
	const next = safeReturnPath(url.searchParams.get('next') ?? '/setup');
	if (!locals.supabase || !code) throw redirect(303, '/setup?auth=error');

	const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
	if (error) throw redirect(303, '/setup?auth=error');
	throw redirect(303, next);
};
