#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { MIRROR_FOLDER, MOVE_KINDS, hashFile, isInside, loadModuleIfPresent, readOptions, readProjectRoot, toPosix } from './lib/prototype-files.mjs';

const EXIT_BAD_ARGUMENTS = 2;
const EXIT_CONFLICT = 3;

const HELP = `Usage: node mirror-file.mjs <prototype-dir> <project-file> [--kind ${MOVE_KINDS.join('|')}] [--hook <name>] [--new] [--force]

Copies <project-file> (a path in the project, or relative to the project root in spec.js) to <prototype-dir>/${MIRROR_FOLDER}/<same path>.
Prints JSON with the move to add to spec.js moves, including the production file's base hash.
--kind   default: view. Containers also need --hook, the real hook that builds the view model.
--new    start a file production does not have yet (empty, no base hash).
--force  replace an existing mirror copy (its edits are lost).

Exit codes: 0 done, ${EXIT_BAD_ARGUMENTS} bad arguments, ${EXIT_CONFLICT} the mirror copy exists (use --force).`;

const fail = (message, code) => {
  console.error(`Error: ${message}`);
  process.exit(code);
};

const { options, positional } = readOptions(process.argv.slice(2), ['force', 'help', 'new']);
if (options.help) {
  console.log(HELP);
  process.exit(0);
}
const [prototypeArgument, fileArgument] = positional;
if (!prototypeArgument || !fileArgument) fail(`a prototype folder and a project file are required.\n${HELP}`, EXIT_BAD_ARGUMENTS);
const kind = options.kind ?? 'view';
if (!MOVE_KINDS.includes(kind)) fail(`--kind must be one of: ${MOVE_KINDS.join(', ')}. Received: "${kind}".`, EXIT_BAD_ARGUMENTS);
if (kind === 'container' && !options.hook) fail('a container move needs --hook <name>.', EXIT_BAD_ARGUMENTS);

const prototypeDirectory = resolve(prototypeArgument);
const spec = await loadModuleIfPresent(prototypeDirectory, 'spec.js');
if (!spec) fail(`${prototypeDirectory} has no spec.js. Run init-prototype.mjs first.`, EXIT_BAD_ARGUMENTS);
const projectRoot = readProjectRoot(prototypeDirectory, spec);

const findProductionFile = () => {
  const candidates = [resolve(fileArgument), resolve(projectRoot, fileArgument)];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
};
const productionFile = findProductionFile();
if (options.new && productionFile) fail(`${fileArgument} already exists in production. Drop --new to mirror it.`, EXIT_BAD_ARGUMENTS);
if (!options.new && !productionFile) fail(`no file at ${fileArgument} (looked in the working directory and ${projectRoot}). Use --new for a new file.`, EXIT_BAD_ARGUMENTS);
const targetFile = productionFile ?? resolve(projectRoot, fileArgument);
if (!isInside(projectRoot, targetFile) || isInside(prototypeDirectory, targetFile)) {
  fail(`${targetFile} is not a production path under ${projectRoot}.`, EXIT_BAD_ARGUMENTS);
}

const projectPath = toPosix(relative(projectRoot, targetFile));
const mirrorFile = join(prototypeDirectory, MIRROR_FOLDER, projectPath);
if (existsSync(mirrorFile) && !options.force) fail(`${MIRROR_FOLDER}/${projectPath} exists. Use --force to replace it.`, EXIT_CONFLICT);
mkdirSync(dirname(mirrorFile), { recursive: true });
if (productionFile) copyFileSync(productionFile, mirrorFile);
else writeFileSync(mirrorFile, '');

const move = { from: `${MIRROR_FOLDER}/${projectPath}`, to: projectPath, kind, ...(productionFile ? { base: hashFile(productionFile) } : {}), ...(options.hook ? { hook: options.hook } : {}) };
console.log(JSON.stringify({
  mirrored: move.from,
  move,
  next: [
    'Add the move to spec.js moves.',
    `Edit ${move.from} in the project's own conventions. Keep its imports as they read in production.`,
  ],
}, null, 2));
