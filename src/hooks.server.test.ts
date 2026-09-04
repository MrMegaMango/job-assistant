import { describe, expect, it } from 'vitest';
import { handle } from './hooks.server';

describe('security response headers', () => {
	it('keeps same-origin form origins while withholding cross-origin referrers', async () => {
		const event = {
			locals: {},
			cookies: { getAll: () => [] },
			url: new URL('http://127.0.0.1:5173/')
		} as unknown as Parameters<typeof handle>[0]['event'];
		const response = await handle({
			event,
			resolve: async () => new Response('ok')
		});

		expect(response.headers.get('referrer-policy')).toBe('same-origin');
		expect(response.headers.get('permissions-policy')).toBe(
			'camera=(), microphone=(), geolocation=()'
		);
		expect(event.locals.requestId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
	});
});
