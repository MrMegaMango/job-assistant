const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	mdash: '—',
	ndash: '–'
};

function decodeEntitiesOnce(value: string): string {
	return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
		if (body.startsWith('#x') || body.startsWith('#X')) {
			return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
		}
		if (body.startsWith('#')) {
			return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
		}
		return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
	});
}

export function htmlToText(value: string): string {
	let decoded = decodeEntitiesOnce(decodeEntitiesOnce(value));
	decoded = decoded
		.replace(/<\s*br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, '\n')
		.replace(/<li(?:\s[^>]*)?>/gi, '- ')
		.replace(/<[^>]+>/g, ' ');

	return decodeEntitiesOnce(decoded)
		.replace(/\r/g, '')
		.replace(/[\t ]+/g, ' ')
		.replace(/\n[\t ]+/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export function normalizeSearchText(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9+#.]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function splitList(value: string): string[] {
	return [...new Set(value.split(/[,\n]/).map((part) => part.trim()).filter(Boolean))];
}

export function safeBoardToken(value: string): string {
	const token = value.trim();
	if (!/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(token)) {
		throw new Error('Board token must contain only letters, numbers, underscores, or hyphens.');
	}
	return token;
}
