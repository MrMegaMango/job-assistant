import { describe, expect, it } from 'vitest';
import { getListingAge, isRecentListing, MAX_LISTING_AGE_DAYS } from './listing-age';

const now = new Date('2026-09-03T12:00:00.000Z');

describe('listing age', () => {
	it('includes listings up to four elapsed days old', () => {
		const age = getListingAge('2026-08-29T12:00:01.000Z', now);
		expect(age).toMatchObject({ days: 4, label: 'Posted 4 days ago' });
		expect(isRecentListing(age)).toBe(true);
	});

	it('excludes listings at the exact five-day boundary', () => {
		const age = getListingAge('2026-08-29T12:00:00.000Z', now);
		expect(age?.days).toBe(MAX_LISTING_AGE_DAYS);
		expect(isRecentListing(age)).toBe(false);
	});

	it('uses natural labels for today and one day ago', () => {
		expect(getListingAge('2026-09-03T08:00:00.000Z', now)?.label).toBe('Posted today');
		expect(getListingAge('2026-09-02T11:00:00.000Z', now)?.label).toBe('Posted 1 day ago');
	});

	it('does not invent an age for missing or invalid posting dates', () => {
		expect(getListingAge(null, now)).toBeNull();
		expect(getListingAge('not-a-date', now)).toBeNull();
	});

	it('rejects future posting timestamps instead of presenting them as fresh', () => {
		expect(getListingAge('2026-09-03T12:00:00.001Z', now)).toBeNull();
	});
});
