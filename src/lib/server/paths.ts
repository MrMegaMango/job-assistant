import { chmodSync, mkdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, relative, resolve } from 'node:path';
import { isHostedDemo } from './deployment';

function isInside(parent: string, child: string): boolean {
	const rel = relative(parent, child);
	return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function defaultDataDir(): string {
	if (process.platform === 'win32') {
		return resolve(process.env.LOCALAPPDATA ?? homedir(), 'JobAssistant');
	}
	return resolve(process.env.XDG_DATA_HOME ?? resolve(homedir(), '.local', 'share'), 'job-assistant');
}

export function getDataDir(): string {
	const path = isHostedDemo()
		? resolve(tmpdir(), 'job-assistant')
		: resolve(process.env.JOB_ASSISTANT_DATA_DIR?.trim() || defaultDataDir());
	if (isInside(resolve(process.cwd()), path)) {
		throw new Error('JOB_ASSISTANT_DATA_DIR must be outside the Git checkout.');
	}
	mkdirSync(path, { recursive: true, mode: 0o700 });
	if (process.platform !== 'win32') chmodSync(path, 0o700);
	return path;
}
