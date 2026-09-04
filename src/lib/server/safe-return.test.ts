import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './safe-return';

describe('safeReturnPath', () => {
	it('allows an internal path with a query string', () => {
		expect(safeReturnPath('/setup?tab=profile')).toBe('/setup?tab=profile');
	});

	it('blocks protocol-relative, external, and malformed redirect targets', () => {
		expect(safeReturnPath('//attacker.example')).toBe('/');
		expect(safeReturnPath('https://attacker.example')).toBe('/');
		expect(safeReturnPath('/safe\\evil')).toBe('/');
		expect(safeReturnPath('/safe\r\nLocation: https://attacker.example')).toBe('/');
	});
});
