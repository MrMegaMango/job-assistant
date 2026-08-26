import { tmpdir } from 'node:os';
import { isAbsolute, relative, resolve } from 'node:path';
import { isHostedDemo } from './deployment';
import { ensurePrivateDirectory } from './runtime-files';

function isInside(parent: string, child: string): boolean {
	const rel = relative(parent, child);
	return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function defaultDataDir(): string {
	if (process.platform === 'win32') {
		const windowsRoot = runtimeEnvironment('LOCALAPPDATA') ?? runtimeEnvironment('USERPROFILE');
		if (!windowsRoot) throw new Error('Set JOB_ASSISTANT_DATA_DIR or LOCALAPPDATA.');
		return resolve(windowsRoot, 'JobAssistant');
	}
	const xdgRoot = runtimeEnvironment('XDG_DATA_HOME');
	if (xdgRoot) return resolve(xdgRoot, 'job-assistant');
	const userRoot = runtimeEnvironment('HOME');
	if (!userRoot) throw new Error('Set JOB_ASSISTANT_DATA_DIR, XDG_DATA_HOME, or HOME.');
	return resolve(userRoot, runtimePath('.local', 'share'), 'job-assistant');
}

function runtimeEnvironment(name: string): string | undefined {
	return process.env[name]?.trim() || undefined;
}

function runtimePath(...parts: string[]): string {
	return parts.join(process.platform === 'win32' ? '\\' : '/');
}

export function getDataDir(): string {
	const path = isHostedDemo()
		? resolve(tmpdir(), 'job-assistant')
		: resolve(process.env.JOB_ASSISTANT_DATA_DIR?.trim() || defaultDataDir());
	if (isInside(resolve(process.cwd()), path)) {
		throw new Error('JOB_ASSISTANT_DATA_DIR must be outside the Git checkout.');
	}
	ensurePrivateDirectory(path);
	return path;
}
