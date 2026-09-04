import { isAbsolute } from 'node:path';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RemotePreference } from '$lib/types';
import { HOSTED_DEMO_MESSAGE, isHostedDemo } from '$lib/server/deployment';
import {
	DEMO_PROFILE_COOKIE,
	getDemoProfile,
	getSelectedDemoProfileId,
	toDemoProfileSummary,
	toPublicMatchProfile
} from '$lib/server/profile';
import { getProfile, saveProfile } from '$lib/server/store';
import { runtimeFileExists } from '$lib/server/runtime-files';
import { splitList } from '$lib/server/text';

export const load: PageServerLoad = ({ cookies, url }) => {
	const hostedDemo = isHostedDemo();
	const demoProfileId = getSelectedDemoProfileId(cookies.get(DEMO_PROFILE_COOKIE));
	const profile = getProfile(demoProfileId);
	return {
		hostedDemo,
		profile: hostedDemo ? null : profile,
		publicProfile: hostedDemo ? toPublicMatchProfile(profile) : null,
		activeDemoProfile: hostedDemo ? toDemoProfileSummary(getDemoProfile(demoProfileId)) : null,
		resumeExists: hostedDemo ? false : Boolean(profile.resumePath && runtimeFileExists(profile.resumePath)),
		saved: url.searchParams.get('saved') === '1'
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const phone = String(data.get('phone') ?? '').trim();
		const resumePath = String(data.get('resumePath') ?? '').trim();
		const targetTitles = splitList(String(data.get('targetTitles') ?? ''));
		const skills = splitList(String(data.get('skills') ?? ''));
		const focusAreas = splitList(String(data.get('focusAreas') ?? ''));
		const preferredLocations = splitList(String(data.get('preferredLocations') ?? ''));
		const excludedKeywords = splitList(String(data.get('excludedKeywords') ?? ''));
		const remotePreference = String(data.get('remotePreference') ?? 'any') as RemotePreference;
		const minimumRaw = String(data.get('minBaseSalary') ?? '').replace(/[$,\s]/g, '');
		const minBaseSalary = minimumRaw ? Number(minimumRaw) : null;

		if (targetTitles.length === 0) return fail(400, { message: 'Add at least one target title.' });
		if (skills.length === 0) return fail(400, { message: 'Add at least one verified skill.' });
		if (focusAreas.length === 0) return fail(400, { message: 'Add at least one preferred focus area.' });
		if (!['remote', 'remote_preferred', 'hybrid', 'any'].includes(remotePreference)) {
			return fail(400, { message: 'Choose a valid work-location preference.' });
		}
		if (minBaseSalary !== null && (!Number.isFinite(minBaseSalary) || minBaseSalary < 0)) {
			return fail(400, { message: 'Base-salary floor must be a positive number.' });
		}
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { message: 'Enter a valid email address.' });
		}
		if (resumePath && !isAbsolute(resumePath)) {
			return fail(400, { message: 'Resume path must be an absolute local path.' });
		}

		try {
			saveProfile({
				name,
				email,
				phone,
				resumePath,
				targetTitles,
				skills,
				focusAreas,
				preferredLocations,
				remotePreference,
				minBaseSalary,
				excludedKeywords
			});
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Could not save profile.' });
		}
		throw redirect(303, '/setup?saved=1');
	}
};
