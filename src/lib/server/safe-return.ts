export function safeReturnPath(value: FormDataEntryValue | string | null): string {
	const path = typeof value === 'string' ? value : '/';
	return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && !/[\r\n]/.test(path)
		? path
		: '/';
}
