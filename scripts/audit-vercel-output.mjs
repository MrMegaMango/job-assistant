import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, parse, relative, resolve, sep } from 'node:path';

const checkout = realpathSync(process.cwd());
const output = resolve(checkout, '.vercel', 'output');

if (!existsSync(output)) process.exit(0);

const outputParent = realpathSync(dirname(output));
if (outputParent !== resolve(checkout, '.vercel')) {
	throw new Error('Refusing to audit a Vercel output directory outside the checkout.');
}

const root = parse(checkout).root;
const outputRealPath = realpathSync(output);
const homeMarker = relative(root, homedir()).split(sep).join('/');
const checkoutMarker = relative(root, checkout).split(sep).join('/');
const sensitiveBasename = /^(auth\.json|hosts\.yml|\.env(?:\..+)?|.*\.sqlite(?:-.+)?|.*\.db(?:-.+)?|.*\.pem|.*\.p12|.*\.pfx|.*resume.*|application-packet\.json)$/i;
let findings = 0;

function isInside(parent, child) {
	const pathFromParent = relative(parent, child);
	return (
		pathFromParent === '' ||
		(!pathFromParent.startsWith(`..${sep}`) && pathFromParent !== '..' && !isAbsolute(pathFromParent))
	);
}

function auditFunctionConfig(configPath) {
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8'));
		if (typeof config.handler !== 'string' || config.handler.length === 0) {
			findings += 1;
			return;
		}
		const functionRoot = dirname(configPath);
		const handlerPath = resolve(functionRoot, config.handler);
		if (!isInside(functionRoot, handlerPath) || !existsSync(handlerPath)) {
			findings += 1;
			return;
		}
		if (!isInside(outputRealPath, realpathSync(handlerPath))) findings += 1;
	} catch {
		findings += 1;
	}
}

function walk(directory) {
	for (const entry of readdirSync(directory)) {
		const absolute = resolve(directory, entry);
		const outputRelative = relative(output, absolute).split(sep).join('/');
		const containsExternalHomePath =
			outputRelative.includes(`${homeMarker}/`) &&
			!outputRelative.includes(`${checkoutMarker}/`);
		if (containsExternalHomePath || sensitiveBasename.test(entry)) findings += 1;
		if (entry === '.vc-config.json') auditFunctionConfig(absolute);

		const stats = lstatSync(absolute);
		if (stats.isSymbolicLink()) {
			try {
				if (!isInside(outputRealPath, realpathSync(absolute))) findings += 1;
			} catch {
				findings += 1;
			}
			continue;
		}
		if (stats.isDirectory()) walk(absolute);
	}
}

walk(output);

if (findings > 0) {
	rmSync(output, { recursive: true, force: true });
	throw new Error(
		`Vercel bundle audit found ${findings} private or external-home paths. The generated output was removed.`
	);
}

console.log('Vercel bundle audit passed: no private or external-home paths were traced.');
