import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SourceProvider } from '$lib/types';
import { HOSTED_DEMO_MESSAGE, isHostedDemo } from '$lib/server/deployment';
import { addSource, listSources, setSourceEnabled } from '$lib/server/store';
import { safeBoardToken } from '$lib/server/text';
import { syncEnabledSources } from '$lib/server/sync';

const POLICY_URLS: Record<SourceProvider, string> = {
	greenhouse: 'https://developer.greenhouse.io/job-board.html',
	ashby: 'https://developers.ashbyhq.com/docs/public-job-posting-api',
	lever: 'https://github.com/lever/postings-api'
};

export const load: PageServerLoad = () => ({ sources: listSources() });

export const actions: Actions = {
	toggle: async ({ request }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		const data = await request.formData();
		const id = Number(data.get('sourceId'));
		const enabled = String(data.get('enabled')) === 'true';
		if (!Number.isInteger(id) || id <= 0) return fail(400, { message: 'Invalid source.' });
		setSourceEnabled(id, enabled);
		return { message: enabled ? 'Source enabled.' : 'Source disabled.' };
	},
	add: async ({ request }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		const data = await request.formData();
		const provider = String(data.get('provider') ?? '') as SourceProvider;
		const name = String(data.get('name') ?? '').trim();
		if (!['greenhouse', 'ashby', 'lever'].includes(provider) || !name) {
			return fail(400, { message: 'Provider and company name are required.' });
		}
		try {
			const boardToken = safeBoardToken(String(data.get('boardToken') ?? ''));
			addSource({ provider, name, boardToken, policyUrl: POLICY_URLS[provider] });
			return { message: `${name} added.` };
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Could not add source.' });
		}
	},
	sync: async () => ({ syncResults: await syncEnabledSources() })
};
