#!/usr/bin/env node
// Checks a prototype's states.js and notes.js for the mistakes that fail silently: unknown ids, empty reasons, missing frames.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_STATE_FIELDS = ['id', 'area', 'label', 'description'];
const RECOMMENDED_STATE_FIELDS = ['owner', 'boundary', 'limits', 'fixture']; // shown in the fixture details and read by the frame
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/; // ids go in the URL, so keep them lowercase and hyphenated
const EXIT_PROBLEMS = 2;

const HELP = `Usage: node check-prototype.mjs [prototype-dir]   (default: current directory)

Validates states.js and notes.js and looks for before/frame.html and after/frame.html. Prints JSON.
Exit codes: 0 no problems, ${EXIT_PROBLEMS} problems found (listed in "errors"), 1 the files could not be loaded.`;

const [directoryArgument = '.'] = process.argv.slice(2);
if (directoryArgument === '--help') {
  console.log(HELP);
  process.exit(0);
}
const directory = resolve(directoryArgument);

const loadModule = async (file) => {
  try {
    return await import(pathToFileURL(join(directory, file)).href);
  } catch (error) {
    console.error(`Error: could not load ${file} from ${directory}: ${error.message}`);
    process.exit(1);
  }
};

const listIds = (ids) => ids.join(', ') || 'none';
const findUnknown = (keys, knownIds) => keys.filter((key) => !knownIds.includes(key));

const { areas = [], states = [] } = await loadModule('states.js');
const { notes = {}, reasons = [] } = await loadModule('notes.js');
const errors = [];
const warnings = [];
const areaIds = areas.map((area) => area.id);
const stateIds = states.map((state) => state.id);

if (!states.length) errors.push('states.js: no states found. Export a non-empty `states` array.');
if (!areas.length) errors.push('states.js: no areas found. Export a non-empty `areas` array.');
stateIds.filter((id, index) => stateIds.indexOf(id) !== index).forEach((id) => errors.push(`states.js: duplicate state id "${id}".`));
states.forEach((state) => {
  REQUIRED_STATE_FIELDS.filter((field) => !state[field]).forEach((field) => errors.push(`states.js: state "${state.id ?? '(no id)'}" is missing "${field}".`));
  RECOMMENDED_STATE_FIELDS.filter((field) => state[field] === undefined).forEach((field) => warnings.push(`states.js: state "${state.id}" has no "${field}".`));
  if (state.area && !areaIds.includes(state.area)) errors.push(`states.js: state "${state.id}" uses unknown area "${state.area}". Areas: ${listIds(areaIds)}.`);
});

[...areaIds, ...stateIds].filter((id) => id && !ID_PATTERN.test(id)).forEach((id) => warnings.push(`states.js: id "${id}" should be lowercase and hyphenated, for example "card-declined".`));

findUnknown(notes.lockedAreas ?? [], areaIds).forEach((id) => errors.push(`notes.js: lockedAreas has unknown area "${id}". Areas: ${listIds(areaIds)}.`));
findUnknown(Object.keys(notes.areas ?? {}), areaIds).forEach((id) => errors.push(`notes.js: notes.areas has unknown area "${id}". Areas: ${listIds(areaIds)}.`));
findUnknown(Object.keys(notes.states ?? {}), stateIds).forEach((id) => errors.push(`notes.js: notes.states has unknown state "${id}". States: ${listIds(stateIds)}.`));
reasons.forEach((reason, index) => {
  if (!reason.selector || typeof reason.selector !== 'string') errors.push(`notes.js: reasons[${index}] needs a selector string.`);
  if (!reason.why || typeof reason.why !== 'string') errors.push(`notes.js: reasons[${index}] needs a non-empty "why".`);
  if (reason.props && !Array.isArray(reason.props)) errors.push(`notes.js: reasons[${index}].props must be an array of property names.`);
});

const constantsPath = join(directory, 'core', 'constants.js');
const isSinglePreview = existsSync(constantsPath) && /COMPARISON_ENABLED\s*=\s*false/.test(readFileSync(constantsPath, 'utf8'));
(isSinglePreview ? ['after'] : ['before', 'after']).filter((side) => !existsSync(join(directory, side, 'frame.html'))).forEach((side) => warnings.push(`${side}/frame.html not found.`));

console.log(JSON.stringify({ ok: !errors.length, counts: { areas: areas.length, states: states.length, reasons: reasons.length }, errors, warnings }, null, 2));
if (errors.length) process.exit(EXIT_PROBLEMS);
