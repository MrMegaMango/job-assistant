type NodeFileSystem = typeof import('node:fs');

function fileSystem(): NodeFileSystem {
	const module = process.getBuiltinModule('fs') as NodeFileSystem | undefined;
	if (!module) throw new Error('The Node.js file-system module is unavailable.');
	return module;
}

export function runtimeFileExists(path: string): boolean {
	return fileSystem().existsSync(path);
}

export function ensurePrivateDirectory(path: string): void {
	const fs = fileSystem();
	fs.mkdirSync(path, { recursive: true, mode: 0o700 });
	if (process.platform !== 'win32') fs.chmodSync(path, 0o700);
}
