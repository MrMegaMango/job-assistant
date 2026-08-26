import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const adapterPath = join(
	projectRoot,
	'node_modules',
	'@sveltejs',
	'adapter-vercel',
	'index.js'
);

const unsafeTraceRoot = `\tlet base = entry;
\twhile (base !== (base = path.dirname(base)));

\tconst traced = await nodeFileTrace([entry], { base });`;

const legacyRepositoryTraceRoot = `\t// Keep file tracing inside the repository. Tracing from the filesystem root can copy
\t// unrelated local files when a runtime dependency accepts a dynamic path.
\tconst base = process.cwd() + path.sep;

\tconst traced = await nodeFileTrace([entry], { base });`;

const boundedRepositoryTraceRoot = `\t// Keep file tracing inside the repository. Tracing from the filesystem root can copy
\t// unrelated local files when a runtime dependency accepts a dynamic path.
\tconst checkout = fs.realpathSync(process.cwd());
\tconst base = process.cwd() + path.sep;

\tconst traced = await nodeFileTrace([entry], { base });
\tfor (const file of traced.fileList) {
\t\tconst tracedPath = fs.realpathSync(path.resolve(base, file));
\t\tconst relativePath = path.relative(checkout, tracedPath);
\t\tif (
\t\t\trelativePath === '..' ||
\t\t\trelativePath.startsWith('..' + path.sep) ||
\t\t\tpath.isAbsolute(relativePath)
\t\t) {
\t\t\tthrow new Error('Refusing to bundle a traced path outside the repository: ' + file);
\t\t}
\t}`;

const unsafeHandler = `\t\t\t\thandler: path.relative(base + ancestor, entry),`;
const repositoryHandler = `\t\t\t\thandler: path.relative(ancestor, entry),`;

const source = readFileSync(adapterPath, 'utf8');

const currentTraceRoot = source.includes(boundedRepositoryTraceRoot)
	? null
	: source.includes(legacyRepositoryTraceRoot)
	? legacyRepositoryTraceRoot
	: source.includes(unsafeTraceRoot)
		? unsafeTraceRoot
		: undefined;

if (currentTraceRoot === undefined) {
	throw new Error(
		'Vercel adapter layout changed; refusing to build until its file-trace boundary is reviewed.'
	);
}

let hardenedSource = currentTraceRoot
	? source.replace(currentTraceRoot, boundedRepositoryTraceRoot)
	: source;

if (hardenedSource.includes(unsafeHandler)) {
	hardenedSource = hardenedSource.replace(unsafeHandler, repositoryHandler);
} else if (!hardenedSource.includes(repositoryHandler)) {
	throw new Error(
		'Vercel adapter handler layout changed; refusing to build until it is reviewed.'
	);
}

if (hardenedSource !== source) writeFileSync(adapterPath, hardenedSource);
