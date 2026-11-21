#!/usr/bin/env node
// Copies the review shell into a prototype folder so the agent does not have to read or copy the files itself.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHELL_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'review-shell');
const STACKS = ['vanilla', 'react'];
const TEMPLATE_FILES = ['states.js', 'notes.js'];
const EXIT_BAD_ARGUMENTS = 2;
const EXIT_CONFLICT = 3;

const HELP = `Usage: node init-prototype.mjs <target-dir> --stack <${STACKS.join('|')}> [--force]

Copies core/ and the chosen stack into <target-dir>, and states.js and notes.js templates if absent.
Existing core/ or stack folders are left alone unless --force is given. Prints JSON.

Exit codes: 0 done, ${EXIT_BAD_ARGUMENTS} bad arguments, ${EXIT_CONFLICT} target exists (use --force).`;

const fail = (message, code) => {
  console.error(`Error: ${message}`);
  process.exit(code);
};

const readArguments = (argv) => {
  const flags = new Set(argv.filter((argument) => argument.startsWith('--') && !argument.includes('=')));
  const stackIndex = argv.indexOf('--stack');
  const stack = stackIndex === -1 ? undefined : argv[stackIndex + 1];
  const target = argv.find((argument, index) => !argument.startsWith('--') && argv[index - 1] !== '--stack');
  return { help: flags.has('--help'), force: flags.has('--force'), stack, target };
};

const { help, force, stack, target } = readArguments(process.argv.slice(2));
if (help) {
  console.log(HELP);
  process.exit(0);
}
if (!target) fail(`a target directory is required.\n${HELP}`, EXIT_BAD_ARGUMENTS);
if (!STACKS.includes(stack)) fail(`--stack must be one of: ${STACKS.join(', ')}. Received: "${stack ?? ''}".`, EXIT_BAD_ARGUMENTS);

const targetDirectory = resolve(target);
mkdirSync(targetDirectory, { recursive: true });
const created = [];
const skipped = [];

['core', stack].forEach((folder) => {
  const destination = join(targetDirectory, folder);
  if (existsSync(destination) && readdirSync(destination).length && !force) {
    skipped.push(folder);
    return;
  }
  cpSync(join(SHELL_DIRECTORY, folder), destination, { recursive: true });
  created.push(folder);
});

TEMPLATE_FILES.forEach((file) => {
  const destination = join(targetDirectory, file);
  if (existsSync(destination) && !force) {
    skipped.push(file);
    return;
  }
  cpSync(join(SHELL_DIRECTORY, 'templates', file), destination);
  created.push(file);
});

const entryPoint = stack === 'vanilla' ? 'vanilla/index.html' : 'react/ReviewShell.tsx (see references/review-shell.md)';
console.log(JSON.stringify({
  target: targetDirectory,
  stack,
  created,
  skipped,
  next: [
    'Replace the examples in states.js and notes.js with the real inventory.',
    'Create before/frame.html and after/frame.html. Each reads ?state, ?theme and ?reset and renders the fixture.',
    `Serve the folder over HTTP (for example: python3 -m http.server) and open ${entryPoint}.`,
  ],
}, null, 2));
if (skipped.length && !created.length) process.exit(EXIT_CONFLICT);
