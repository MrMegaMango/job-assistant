import { randomUUID } from 'node:crypto';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.requestId = randomUUID();
	const response = await resolve(event);
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('x-frame-options', 'DENY');
	// `no-referrer` makes Chromium serialize the Origin header as `null` for native
	// form POSTs. `same-origin` keeps same-origin CSRF validation working while still
	// withholding referrers from employer and policy links on other origins.
	response.headers.set('referrer-policy', 'same-origin');
	response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};
