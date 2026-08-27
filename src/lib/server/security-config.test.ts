import { describe, expect, it } from 'vitest';
import config from '../../../svelte.config.js';

describe('deployment security configuration', () => {
	it('allows form actions from only the canonical production alias', () => {
		expect(config.kit?.csrf?.trustedOrigins).toEqual([
			'https://high-match-job-assistant.vercel.app'
		]);
		expect(config.kit?.csrf?.trustedOrigins).not.toContain('*');
	});
});
