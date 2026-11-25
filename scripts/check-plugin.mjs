// Checks that the Claude Code and Codex plugin manifests match package.json and that their paths exist.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PLUGIN_NAME = 'kevin-umali-skills';
const MANIFESTS = ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json'];
const PLUGIN_ROOT_VARIABLE = /\$\{PLUGIN_ROOT\}\/([^"\\\s]+)/g;

const readJson = (file) => JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
const { version } = readJson('package.json');
const problems = [];

MANIFESTS.forEach((file) => {
  const manifest = readJson(file);
  if (manifest.name !== PLUGIN_NAME) problems.push(`${file}: name must be "${PLUGIN_NAME}" (got "${manifest.name}")`);
  if (manifest.version !== version) problems.push(`${file}: version ${manifest.version} must match package.json ${version}`);
});

const codexManifest = readJson('.codex-plugin/plugin.json');
[codexManifest.skills, codexManifest.hooks].filter(Boolean).forEach((path) => {
  if (!existsSync(join(ROOT, path))) problems.push(`.codex-plugin/plugin.json: ${path} does not exist`);
});
if (codexManifest.hooks) {
  [...readFileSync(join(ROOT, codexManifest.hooks), 'utf8').matchAll(PLUGIN_ROOT_VARIABLE)].forEach(([, path]) => {
    if (!existsSync(join(ROOT, path))) problems.push(`${codexManifest.hooks}: ${path} does not exist`);
  });
}

['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json'].forEach((file) => {
  if (!readJson(file).plugins.some((entry) => entry.name === PLUGIN_NAME)) problems.push(`${file}: no entry for ${PLUGIN_NAME}`);
});

if (problems.length) {
  problems.forEach((problem) => console.error(problem));
  process.exit(1);
}
console.log(`Plugin manifests match package.json ${version}.`);
