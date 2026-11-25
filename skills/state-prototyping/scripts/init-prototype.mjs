#!/usr/bin/env node
// Copies the review shell into a prototype folder so the agent does not have to read or copy the files itself.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const SHELL_DIRECTORY = join(ASSETS_DIRECTORY, 'review-shell');
const MIRROR_DIRECTORY = join(ASSETS_DIRECTORY, 'mirror');
// Not named after the stack: with tsconfig baseUrl or a Vite root at the prototype, a react/ folder resolves before the react package.
const SHELL_FOLDER = 'shell';
const STACKS = ['vanilla', 'react'];
const TEMPLATE_FILES = ['states.js', 'notes.js', 'spec.js', 'measure.html'];
const EXIT_BAD_ARGUMENTS = 2;
const EXIT_CONFLICT = 3;

const STATE_DEFAULTS = {
  owner: 'Prototype (new UI)',
  boundary: 'No network. Fixture data only.',
  limits: 'Does not prove native, live or persisted behavior.',
};
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const HELP = `Usage: node init-prototype.mjs <target-dir> --stack <${STACKS.join('|')}> [--project <dir>] [--no-comparison] [--no-highlights] [--states <file.json>] [--force]

Copies core/ and the chosen stack (as shell/, with a host page for react) into <target-dir>, plus states.js,
notes.js, spec.js, measure.html and the frame page(s), creates mirror/, and for Vite projects adds a prototype-only
vite.config.mjs with the mirror plugin.
Existing folders and files are left alone unless --force is given.
--no-comparison  single editable preview (after/frame.html only); highlights go with it
--no-highlights  keep the comparison but build no highlights, inspector or legend
--project <dir>  the project root, written to spec.js as a relative projectRoot (default: the working directory)
--states <file>  JSON array of { id, area, label, description, owner? }; writes states.js with boundary, limits and fixture defaults
Prints JSON: created, skipped, flags, next. The templates document their own shapes.

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
  const projectIndex = argv.indexOf('--project');
  const project = projectIndex === -1 ? '.' : argv[projectIndex + 1];
  const target = argv.find((argument, index) => !argument.startsWith('--') && !['--stack', '--states', '--project'].includes(argv[index - 1]));
  return { help: flags.has('--help'), force: flags.has('--force'), noComparison: flags.has('--no-comparison'), noHighlights: flags.has('--no-highlights'), stack, statesFile, hasStatesFlag: statesIndex !== -1, project, target };
};

const { help, force, noComparison, noHighlights, stack, statesFile, hasStatesFlag, project, target } = readArguments(process.argv.slice(2));
if (help) {
  console.log(HELP);
  process.exit(0);
}
if (!target) fail(`a target directory is required.\n${HELP}`, EXIT_BAD_ARGUMENTS);
if (!project || !existsSync(resolve(project))) fail(`--project must be an existing folder. Received: "${project ?? ''}".`, EXIT_BAD_ARGUMENTS);
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

[['core', 'core'], [stack, SHELL_FOLDER]].forEach(([source, folder]) => {
  const destination = join(targetDirectory, folder);
  if (existsSync(destination) && readdirSync(destination).length && !force) {
    skipped.push(folder);
    return;
  }
  cpSync(join(SHELL_DIRECTORY, source), destination, { recursive: true });
  created.push(folder);
});

const copyFile = (sourcePath, label) => {
  const destinationPath = join(targetDirectory, label);
  if (existsSync(destinationPath) && !force) {
    skipped.push(label);
    return;
  }
  mkdirSync(dirname(destinationPath), { recursive: true });
  cpSync(sourcePath, destinationPath);
  created.push(label);
};
const copyTemplate = (template, label = template) => copyFile(join(SHELL_DIRECTORY, 'templates', template), label);

TEMPLATE_FILES.forEach((file) => copyTemplate(file));
if (statesSource) {
  const statesPath = join(targetDirectory, 'states.js');
  // copyTemplate leaves an existing states.js alone unless --force; --states follows the same rule.
  if (created.includes('states.js')) writeFileSync(statesPath, statesSource);
}
(noComparison ? ['after'] : ['before', 'after']).forEach((side) => {
  if (stack === 'react') ['frame.html', 'frame.tsx'].forEach((file) => copyTemplate(`react-frame/${file}`, `${side}/${file}`));
  else copyTemplate('frame.html', `${side}/frame.html`);
});

if (created.includes('spec.js')) {
  const specPath = join(targetDirectory, 'spec.js');
  const projectRoot = relative(targetDirectory, resolve(project)).split('\\').join('/') || '.';
  writeFileSync(specPath, readFileSync(specPath, 'utf8').replace(/export const projectRoot = '[^']*';/, `export const projectRoot = '${projectRoot}';`));
}

if (stack === 'react') ['index.html', 'main.tsx'].forEach((file) => copyFile(join(SHELL_DIRECTORY, 'templates', 'react-host', file), `${SHELL_FOLDER}/${file}`));

const readProjectDependencies = () => {
  const packagePath = join(resolve(project), 'package.json');
  if (!existsSync(packagePath)) return {};
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  return { ...packageJson.dependencies, ...packageJson.devDependencies };
};
const usesVite = 'vite' in readProjectDependencies();
if (usesVite) ['vite-plugin-mirror.mjs', 'vite.config.mjs'].forEach((file) => copyFile(join(MIRROR_DIRECTORY, file), file));
const mirrorPath = join(targetDirectory, 'mirror');
if (existsSync(mirrorPath)) skipped.push('mirror/');
else {
  mkdirSync(mirrorPath);
  created.push('mirror/');
}

// Feature flags live in core/constants.js. Set them here so nobody edits the copied shell by hand.
const setFlag = (name, value) => {
  const constantsPath = join(targetDirectory, 'core', 'constants.js');
  const source = readFileSync(constantsPath, 'utf8');
  writeFileSync(constantsPath, source.replace(new RegExp(`(export const ${name} = )(true|false)`), `$1${value}`));
};
const flags = { comparison: !noComparison, highlights: !noHighlights && !noComparison };
if (noComparison) setFlag('COMPARISON_ENABLED', false);
if (noHighlights) setFlag('CHANGE_TRACKING_ENABLED', false);

const prototypePath = relative(resolve(project), targetDirectory).split('\\').join('/');
const serveCommand = usesVite ? `npx vite --config ${prototypePath}/vite.config.mjs` : 'python3 -m http.server';
console.log(JSON.stringify({
  target: targetDirectory,
  stack,
  flags,
  created,
  skipped,
  next: [
    statesSource ? 'Fill each state\'s fixture in states.js.' : 'Replace the example in states.js with the real inventory (or rerun with --states).',
    'Frames: Before imports the production view, After the mirror copy (mirror-file.mjs). Both pass a view model built from state.fixture.',
    usesVite ? 'A Before view that calls its data hook: map the hook to a fixture in STUBS in vite.config.mjs.' : 'No Vite: mirror imports must resolve where the files sit.',
    `Serve from the project root: ${serveCommand}, then open ${prototypePath}/${SHELL_FOLDER}/index.html. measure-prototype.mjs serves it itself.`,
  ],
}, null, 2));
if (skipped.length && !created.length) process.exit(EXIT_CONFLICT);
