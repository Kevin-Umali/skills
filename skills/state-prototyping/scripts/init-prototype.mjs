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

const STATE_FIELDS = {
  id: 'stable kebab-case, goes in the URL',
  area: 'area id; the sidebar groups by it',
  label: 'short name',
  description: 'what the reviewer sees',
  owner: 'where the real screen lives, or "Prototype (new UI)"',
  boundary: 'what is faked',
  limits: 'what this state does not prove',
  fixture: 'data the frame page renders for this state',
};
const NOTES_SHAPE = {
  notes: { lockedAreas: ['<area id>'], shared: ['<line>'], areas: { '<area id>': ['<line>'] }, states: { '<state id>': ['<line>'] } },
  reasons: [{ selector: '<css selector>', props: ['<optional css property>'], why: '<intent, from the user point of view>' }],
};
const STATE_DEFAULTS = {
  owner: 'Prototype (new UI)',
  boundary: 'No network. Fixture data only.',
  limits: 'Does not prove native, live or persisted behavior.',
};
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const HELP = `Usage: node init-prototype.mjs <target-dir> --stack <${STACKS.join('|')}> [--no-comparison] [--no-highlights] [--states <file.json>] [--force]

Copies core/ and the chosen stack into <target-dir>, plus states.js, notes.js and the frame page(s) if absent.
Existing folders and files are left alone unless --force is given.
--no-comparison  single editable preview (after/frame.html only); highlights go with it
--no-highlights  keep the comparison but build no highlights, inspector or legend
--states <file>  JSON array of { id, area, label, description, owner? }; writes states.js with boundary, limits and fixture defaults
Prints JSON: created, skipped, flags, stateFields, notesShape, next.

Exit codes: 0 done, ${EXIT_BAD_ARGUMENTS} bad arguments, ${EXIT_CONFLICT} target exists (use --force).`;

const fail = (message, code) => {
  console.error(`Error: ${message}`);
  process.exit(code);
};

const readArguments = (argv) => {
  const flags = new Set(argv.filter((argument) => argument.startsWith('--') && !argument.includes('=')));
  const stackIndex = argv.indexOf('--stack');
  const stack = stackIndex === -1 ? undefined : argv[stackIndex + 1];
  const statesIndex = argv.indexOf('--states');
  const statesFile = statesIndex === -1 ? undefined : argv[statesIndex + 1];
  const target = argv.find((argument, index) => !argument.startsWith('--') && !['--stack', '--states'].includes(argv[index - 1]));
  return { help: flags.has('--help'), force: flags.has('--force'), noComparison: flags.has('--no-comparison'), noHighlights: flags.has('--no-highlights'), stack, statesFile, hasStatesFlag: statesIndex !== -1, target };
};

const { help, force, noComparison, noHighlights, stack, statesFile, hasStatesFlag, target } = readArguments(process.argv.slice(2));
if (help) {
  console.log(HELP);
  process.exit(0);
}
if (!target) fail(`a target directory is required.\n${HELP}`, EXIT_BAD_ARGUMENTS);
if (!STACKS.includes(stack)) fail(`--stack must be one of: ${STACKS.join(', ')}. Received: "${stack ?? ''}".`, EXIT_BAD_ARGUMENTS);

const toLabel = (id) => id.replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase());

// Turns the agent's inventory into states.js. Validated before anything is copied, so a bad file leaves the target untouched.
const buildStatesSource = (file) => {
  let inventory;
  try {
    inventory = JSON.parse(readFileSync(resolve(file), 'utf8'));
  } catch (error) {
    fail(`--states ${file}: ${error.message}`, EXIT_BAD_ARGUMENTS);
  }
  if (!Array.isArray(inventory) || !inventory.length) fail('--states: the file must hold a non-empty JSON array.', EXIT_BAD_ARGUMENTS);
  const problems = [];
  const seen = new Set();
  inventory.forEach((entry, index) => {
    const name = `[${index}]${entry?.id ? ` "${entry.id}"` : ''}`;
    ['id', 'area', 'label', 'description'].filter((field) => typeof entry?.[field] !== 'string' || !entry[field].trim()).forEach((field) => problems.push(`${name} needs a non-empty string "${field}".`));
    if (typeof entry?.id === 'string' && !ID_PATTERN.test(entry.id)) problems.push(`${name} id must be lowercase and hyphenated.`);
    if (seen.has(entry?.id)) problems.push(`${name} duplicate id.`);
    seen.add(entry?.id);
  });
  if (problems.length) fail(`--states ${file}:\n  ${problems.join('\n  ')}`, EXIT_BAD_ARGUMENTS);

  // An area given as plain text ("Billing card") becomes a kebab-case id with the text as its label.
  const toAreaId = (area) => area.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'main';
  const areas = [];
  const states = inventory.map((entry) => {
    const areaId = toAreaId(entry.area);
    if (!areas.some((area) => area.id === areaId)) areas.push({ id: areaId, label: ID_PATTERN.test(entry.area) ? toLabel(entry.area) : entry.area.trim() });
    const { area, owner, ...rest } = entry;
    return { id: rest.id, area: areaId, label: rest.label, description: rest.description, owner: owner || STATE_DEFAULTS.owner, boundary: rest.boundary || STATE_DEFAULTS.boundary, limits: rest.limits || STATE_DEFAULTS.limits, fixture: rest.fixture ?? {} };
  });
  const asSource = (value) => JSON.stringify(value, null, 2).replace(/^(\s*)"(\w+)":/gm, '$1$2:');
  return `// State registry: one source for the review shell list, navigation and each preview's fixture.\nexport const areas = ${asSource(areas)};\n\nexport const states = ${asSource(states)};\n`;
};

if (hasStatesFlag && !statesFile) fail('--states needs a file path.', EXIT_BAD_ARGUMENTS);
const statesSource = statesFile ? buildStatesSource(statesFile) : undefined;

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
if (statesSource) {
  const statesPath = join(targetDirectory, 'states.js');
  // copyTemplate leaves an existing states.js alone unless --force; --states follows the same rule.
  if (created.includes('states.js')) writeFileSync(statesPath, statesSource);
}
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
  stateFields: STATE_FIELDS,
  notesShape: flags.highlights ? NOTES_SHAPE : undefined,
  next: [
    statesSource ? 'Fill each state\'s fixture in states.js, then run check-prototype.mjs.' : 'Replace the example in states.js with the real inventory (or rerun with --states), then run check-prototype.mjs.',
    'Replace the placeholder body of each frame.html with the real preview of state.fixture.',
    `Serve the folder over HTTP (for example: python3 -m http.server) and open ${entryPoint}.`,
  ],
}, null, 2));
if (skipped.length && !created.length) process.exit(EXIT_CONFLICT);
