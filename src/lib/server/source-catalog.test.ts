import { describe, expect, it } from 'vitest';
import { DEFAULT_SOURCES, SOURCE_POLICY_URLS } from './source-catalog';

describe('default source catalog', () => {
	it('provides broad, unique employer coverage', () => {
		const keys = DEFAULT_SOURCES.map((source) => `${source.provider}:${source.boardToken}`);
		expect(DEFAULT_SOURCES.length).toBeGreaterThanOrEqual(90);
		expect(new Set(keys).size).toBe(keys.length);
		expect(new Set(DEFAULT_SOURCES.map((source) => source.name)).size).toBe(DEFAULT_SOURCES.length);
	});

	it('uses the official policy URL for every provider', () => {
		for (const source of DEFAULT_SOURCES) {
			expect(source.policyUrl).toBe(SOURCE_POLICY_URLS[source.provider]);
		}
	});
});
