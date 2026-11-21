#!/usr/bin/env node
// Copies the review shell into a prototype folder so the agent does not have to read or copy the files itself.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHELL_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'review-shell');
const STACKS = ['vanilla', 'react'];
const TEMPLATE_FILES = ['states.js', 'notes.js'];
const EXIT_BAD_ARGUMENTS = 2;
const EXIT_CONFLICT = 3;

const HELP = `Usage: node init-prototype.mjs <target-dir> --stack <${STACKS.join('|')}> [--no-comparison] [--no-highlights] [--force]

Copies core/ and the chosen stack into <target-dir>, plus states.js, notes.js and the frame page(s) if absent.
Existing folders and files are left alone unless --force is given.
--no-comparison  single editable preview (after/frame.html only); highlights go with it
--no-highlights  keep the comparison but build no highlights, inspector or legend
Prints JSON.

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
  return { help: flags.has('--help'), force: flags.has('--force'), noComparison: flags.has('--no-comparison'), noHighlights: flags.has('--no-highlights'), stack, target };
};

const { help, force, noComparison, noHighlights, stack, target } = readArguments(process.argv.slice(2));
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

const copyTemplate = (template, destinationPath, label) => {
  if (existsSync(destinationPath) && !force) {
    skipped.push(label);
    return;
  }
  mkdirSync(dirname(destinationPath), { recursive: true });
  cpSync(join(SHELL_DIRECTORY, 'templates', template), destinationPath);
  created.push(label);
};

TEMPLATE_FILES.forEach((file) => copyTemplate(file, join(targetDirectory, file), file));
(noComparison ? ['after'] : ['before', 'after']).forEach((side) => copyTemplate('frame.html', join(targetDirectory, side, 'frame.html'), `${side}/frame.html`));

// Feature flags live in core/constants.js. Set them here so nobody edits the copied shell by hand.
const setFlag = (name, value) => {
  const constantsPath = join(targetDirectory, 'core', 'constants.js');
  const source = readFileSync(constantsPath, 'utf8');
  writeFileSync(constantsPath, source.replace(new RegExp(`(export const ${name} = )(true|false)`), `$1${value}`));
};
const flags = { comparison: !noComparison, highlights: !noHighlights && !noComparison };
if (noComparison) setFlag('COMPARISON_ENABLED', false);
if (noHighlights) setFlag('CHANGE_TRACKING_ENABLED', false);

const entryPoint = stack === 'vanilla' ? 'vanilla/index.html' : 'react/ReviewShell.tsx (see references/review-shell.md)';
console.log(JSON.stringify({
  target: targetDirectory,
  stack,
  flags,
  created,
  skipped,
  next: [
    'Replace the examples in states.js and notes.js with the real inventory, then run check-prototype.mjs.',
    'Replace the placeholder body of each frame.html with the real preview of state.fixture.',
    `Serve the folder over HTTP (for example: python3 -m http.server) and open ${entryPoint}.`,
  ],
}, null, 2));
if (skipped.length && !created.length) process.exit(EXIT_CONFLICT);
