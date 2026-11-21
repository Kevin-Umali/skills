#!/usr/bin/env node
// Finds the stack and any design references in a project, so the agent can skip the "is there a design system?" search.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const MAX_DEPTH = 3;
const MAX_RESULTS = 12;
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.turbo', 'coverage']);
const DESIGN_FILE_PATTERN = /^(DESIGN\.md|design-system.*|tokens?\.(json|css|ts|js)|theme\.(json|css|ts|js)|components\.json|tailwind\.config\.\w+|\.storybook)$/i;
const FRAMEWORK_PACKAGES = ['react', 'vue', 'svelte', 'solid-js', 'next', 'nuxt', '@sveltejs/kit', 'astro', 'vite', 'tailwindcss', 'storybook', '@storybook/react', 'expo', 'react-native'];

const HELP = `Usage: node detect-context.mjs [project-dir]   (default: current directory)

Prints JSON: framework packages from package.json, design references found within ${MAX_DEPTH} folders, and any existing .state-prototype folder.`;

const [directoryArgument = '.'] = process.argv.slice(2);
if (directoryArgument === '--help') {
  console.log(HELP);
  process.exit(0);
}
const root = resolve(directoryArgument);

const findDesignReferences = (directory, depth = 0) => {
  if (depth > MAX_DEPTH) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (DESIGN_FILE_PATTERN.test(entry.name)) return [relative(root, entryPath)];
    return entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name) ? findDesignReferences(entryPath, depth + 1) : [];
  });
};

const readPackageJson = () => {
  const packagePath = join(root, 'package.json');
  return existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')) : {};
};

const packageJson = readPackageJson();
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
const designReferences = findDesignReferences(root);

console.log(JSON.stringify({
  root,
  frameworks: FRAMEWORK_PACKAGES.filter((name) => name in dependencies).map((name) => `${name}@${dependencies[name]}`),
  designReferences: designReferences.slice(0, MAX_RESULTS),
  designReferencesTruncated: designReferences.length > MAX_RESULTS,
  existingPrototype: existsSync(join(root, '.state-prototype')),
}, null, 2));
