import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfigFromFile, mergeConfig } from 'vite';
import { mirrorPlugin } from './vite-plugin-mirror.mjs';
import { projectRoot } from './spec.js';

const PROTOTYPE_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(PROTOTYPE_DIRECTORY, projectRoot);

// A Before view that calls its data hook gets a fixture instead: { '<project path of the hook>': '<fixture path in this folder>' }.
const STUBS = {};

const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, undefined, PROJECT_ROOT);

export default mergeConfig(loaded?.config ?? {}, {
  root: PROJECT_ROOT,
  plugins: [mirrorPlugin({ prototype: relative(PROJECT_ROOT, PROTOTYPE_DIRECTORY), root: PROJECT_ROOT, stubs: STUBS })],
});
