import { isAbsolute } from 'node:path';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RemotePreference } from '$lib/types';
import {
	ACCOUNT_PROFILE_COOKIE,
	savedMatchProfileInputSchema,
	saveSavedMatchProfile
} from '$lib/server/account-profile';
import { HOSTED_DEMO_MESSAGE, isHostedDemo } from '$lib/server/deployment';
import {
	DEMO_PROFILE_COOKIE,
	getDemoProfile,
	getSelectedDemoProfileId,
	isDemoProfileId,
	toDemoProfileSummary,
	toPublicMatchProfile
} from '$lib/server/profile';
import { getProfile, saveProfile } from '$lib/server/store';
import { isSupabaseConfigured } from '$lib/server/supabase';
import { runtimeFileExists } from '$lib/server/runtime-files';
import { splitList } from '$lib/server/text';

function matchingProfileFromForm(data: FormData) {
	const minimumRaw = String(data.get('minBaseSalary') ?? '').replace(/[$,\s]/g, '');
	return {
		targetTitles: splitList(String(data.get('targetTitles') ?? '')),
		skills: splitList(String(data.get('skills') ?? '')),
		focusAreas: splitList(String(data.get('focusAreas') ?? '')),
		preferredLocations: splitList(String(data.get('preferredLocations') ?? '')),
		remotePreference: String(data.get('remotePreference') ?? 'any'),
		minBaseSalary: minimumRaw ? Number(minimumRaw) : null,
		excludedKeywords: splitList(String(data.get('excludedKeywords') ?? ''))
	};
}

export const load: PageServerLoad = ({ cookies, locals, url }) => {
	const hostedDemo = isHostedDemo();
	const demoProfileId = getSelectedDemoProfileId(cookies.get(DEMO_PROFILE_COOKIE));
	const profile = getProfile(demoProfileId, locals.savedMatchProfile);
	const creatingProfile = Boolean(
		hostedDemo && locals.user && url.searchParams.get('new') === '1'
	);
	const requestedPresetId = url.searchParams.get('preset') ?? undefined;
	const presetProfile =
		creatingProfile && isDemoProfileId(requestedPresetId)
			? getDemoProfile(requestedPresetId)
			: null;
	const matchingProfile = creatingProfile
		? (presetProfile?.criteria ?? locals.savedMatchProfile ?? getDemoProfile(demoProfileId).criteria)
		: profile;
	return {
		hostedDemo,
		profile: hostedDemo ? null : profile,
		publicProfile: hostedDemo ? toPublicMatchProfile(profile) : null,
		matchingProfile:
			hostedDemo && locals.user
				? {
						id: creatingProfile ? null : (locals.savedMatchProfile?.id ?? null),
						name: creatingProfile
							? (presetProfile?.label ?? 'New profile')
							: (locals.savedMatchProfile?.name ?? 'Primary'),
						targetTitles: [...matchingProfile.targetTitles],
						skills: [...matchingProfile.skills],
						focusAreas: [...matchingProfile.focusAreas],
						preferredLocations: [...matchingProfile.preferredLocations],
						remotePreference: matchingProfile.remotePreference,
						minBaseSalary: matchingProfile.minBaseSalary,
						excludedKeywords: [...matchingProfile.excludedKeywords]
					}
				: null,
		creatingProfile,
		activeDemoProfile:
			hostedDemo && !locals.user ? toDemoProfileSummary(getDemoProfile(demoProfileId)) : null,
		account: hostedDemo
			? {
					configured: isSupabaseConfigured(),
					signedIn: Boolean(locals.user),
					profileSaved: locals.savedMatchProfiles.length > 0,
					profileCount: locals.savedMatchProfiles.length,
					profileUnavailable: locals.savedMatchProfileUnavailable
				}
			: null,
		resumeExists: hostedDemo ? false : Boolean(profile.resumePath && runtimeFileExists(profile.resumePath)),
		saved: url.searchParams.get('saved') === '1',
		authError: url.searchParams.get('auth') === 'error'
	};
};

export const actions: Actions = {
	saveLocalProfile: async ({ request }) => {
		if (isHostedDemo()) return fail(403, { message: HOSTED_DEMO_MESSAGE });
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const phone = String(data.get('phone') ?? '').trim();
		const resumePath = String(data.get('resumePath') ?? '').trim();
		const match = matchingProfileFromForm(data);
		const remotePreference = match.remotePreference as RemotePreference;

		if (match.targetTitles.length === 0) return fail(400, { message: 'Add at least one target title.' });
		if (match.skills.length === 0) return fail(400, { message: 'Add at least one verified skill.' });
		if (match.focusAreas.length === 0) return fail(400, { message: 'Add at least one preferred focus area.' });
		if (!['remote', 'remote_preferred', 'hybrid', 'any'].includes(remotePreference)) {
			return fail(400, { message: 'Choose a valid work-location preference.' });
		}
		if (match.minBaseSalary !== null && (!Number.isFinite(match.minBaseSalary) || match.minBaseSalary < 0)) {
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
				targetTitles: match.targetTitles,
				skills: match.skills,
				focusAreas: match.focusAreas,
				preferredLocations: match.preferredLocations,
				remotePreference,
				minBaseSalary: match.minBaseSalary,
				excludedKeywords: match.excludedKeywords
			});
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Could not save profile.' });
		}
		throw redirect(303, '/setup?saved=1');
	},
	saveAccountProfile: async ({ cookies, locals, request, url }) => {
		if (!isHostedDemo()) return fail(403, { message: 'Account profiles are available online only.' });
		if (!locals.supabase || !locals.user) {
			return fail(401, { message: 'Sign in with Google before saving a profile.' });
		}
		const data = await request.formData();
		const profileId = String(data.get('profileId') ?? '').trim() || null;
		if (profileId && !locals.savedMatchProfiles.some((profile) => profile.id === profileId)) {
			return fail(400, { message: 'Choose a valid saved profile.' });
		}
		const parsed = savedMatchProfileInputSchema.safeParse({
			profileId,
			name: String(data.get('profileName') ?? ''),
			...matchingProfileFromForm(data)
		});
		if (!parsed.success) {
			return fail(400, {
				message:
					'Add a profile name plus at least one target title, verified skill, and preferred focus area.'
			});
		}
		try {
			const saved = await saveSavedMatchProfile(locals.supabase, locals.user.id, parsed.data);
			cookies.set(ACCOUNT_PROFILE_COOKIE, saved.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: url.protocol === 'https:',
				maxAge: 60 * 60 * 24 * 365
			});
		} catch (error) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'code' in error &&
				error.code === '23505'
			) {
				return fail(409, { message: 'Use a unique name for each profile.' });
			}
			return fail(503, { message: 'Your profile could not be saved right now. Please try again.' });
		}
		throw redirect(303, '/setup?saved=1');
	}
};
