import { describe, expect, it } from 'vitest';
import config from '../../../svelte.config.js';

describe('deployment security configuration', () => {
	it('allows form actions from only the canonical production alias', () => {
		expect(config.kit?.csrf?.trustedOrigins).toEqual([
			'https://high-match-job-assistant.vercel.app'
		]);
		expect(config.kit?.csrf?.trustedOrigins).not.toContain('*');
	});

	it('uses SvelteKit nonces for executable scripts', () => {
		expect(config.kit?.csp?.mode).toBe('nonce');
		expect(config.kit?.csp?.directives?.['script-src']).toEqual(['self']);
		expect(config.kit?.csp?.directives?.['form-action']).toEqual(['self']);
		expect(config.kit?.csp?.directives?.['frame-ancestors']).toEqual(['none']);
	});
});
