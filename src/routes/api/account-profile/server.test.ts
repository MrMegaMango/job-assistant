import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCOUNT_PROFILE_COOKIE } from '$lib/server/account-profile';
import { POST } from './+server';

const selectedId = '00000000-0000-4000-8000-000000000002';

function request(profileId: string): Request {
	return new Request('https://example.test/api/account-profile', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ profileId, returnTo: '/' })
	});
}

afterEach(() => vi.unstubAllEnvs());

describe('saved account profile selection', () => {
	it('stores only a profile owned by the signed-in account', async () => {
		vi.stubEnv('JOB_ASSISTANT_HOSTED_DEMO', '1');
		const set = vi.fn();
		const result = POST({
			cookies: { set },
			locals: {
				user: { id: 'user-1' },
				savedMatchProfiles: [{ id: selectedId }]
			},
			request: request(selectedId),
			url: new URL('https://example.test/api/account-profile')
		} as never);

		await expect(result).rejects.toMatchObject({ status: 303, location: '/' });
		expect(set).toHaveBeenCalledWith(
			ACCOUNT_PROFILE_COOKIE,
			selectedId,
			expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: true })
		);
	});

	it('rejects a profile id that is not in the signed-in account', async () => {
		vi.stubEnv('JOB_ASSISTANT_HOSTED_DEMO', '1');
		const result = POST({
			cookies: { set: vi.fn() },
			locals: { user: { id: 'user-1' }, savedMatchProfiles: [{ id: selectedId }] },
			request: request('00000000-0000-4000-8000-000000000099'),
			url: new URL('https://example.test/api/account-profile')
		} as never);

		await expect(result).rejects.toMatchObject({ status: 400 });
	});
});
