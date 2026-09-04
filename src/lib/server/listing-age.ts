import type { ListingAge } from '$lib/types';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const MAX_LISTING_AGE_DAYS = 5;

function currentTime(now: Date | number): number {
	const value = typeof now === 'number' ? now : now.getTime();
	return Number.isFinite(value) ? value : Date.now();
}

function ageLabel(days: number): string {
	if (days === 0) return 'Posted today';
	if (days === 1) return 'Posted 1 day ago';
	return `Posted ${days} days ago`;
}

export function getListingAge(
	postedAt: string | null,
	now: Date | number = Date.now()
): ListingAge | null {
	if (!postedAt) return null;
	const postedTime = Date.parse(postedAt);
	if (!Number.isFinite(postedTime)) return null;
	const nowTime = currentTime(now);
	if (postedTime > nowTime) return null;
	const days = Math.floor((nowTime - postedTime) / MILLISECONDS_PER_DAY);
	return {
		days,
		label: ageLabel(days),
		postedAt: new Date(postedTime).toISOString()
	};
}

export function isRecentListing(age: ListingAge | null): age is ListingAge {
	return age !== null && age.days < MAX_LISTING_AGE_DAYS;
}
