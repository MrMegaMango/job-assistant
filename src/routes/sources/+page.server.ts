import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { HOSTED_DEMO_MESSAGE, isHostedDemo } from '$lib/server/deployment';
import { SOURCE_POLICY_URLS } from '$lib/server/source-catalog';
import {
	getCompanyLeadership,
	LEADERSHIP_RESEARCHED_AT,
	SURNAME_CONTEXT
} from '$lib/server/company-leadership';
import { parseBoardInput } from '$lib/server/source-input';
import { addSource, listSources, setSourceEnabled } from '$lib/server/store';
import { syncEnabledSources } from '$lib/server/sync';

export const load: PageServerLoad = () => ({
	sources: listSources().map((source) => ({
		...source,
		leadership: getCompanyLeadership(source.name)
	})),
	leadershipResearchedAt: LEADERSHIP_RESEARCHED_AT,
	surnameContext: SURNAME_CONTEXT
});

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
		const name = String(data.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Company name is required.' });
		try {
			const { provider, boardToken } = parseBoardInput(
				String(data.get('provider') ?? ''),
				String(data.get('boardToken') ?? '')
			);
			addSource({ provider, name, boardToken, policyUrl: SOURCE_POLICY_URLS[provider] });
			return { message: `${name} added.` };
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Could not add source.' });
		}
	},
	sync: async () => ({ syncResults: await syncEnabledSources() })
};
