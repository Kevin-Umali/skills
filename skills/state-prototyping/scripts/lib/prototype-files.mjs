import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MIRROR_FOLDER = 'mirror';
export const MOVE_KINDS = ['token', 'shared', 'view', 'container'];
const HASH_LENGTH = 16;
const IGNORED_ENTRIES = new Set(['.DS_Store', '.gitkeep']);

export const hashFile = (file) => `sha256-${createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, HASH_LENGTH)}`;

export const isInside = (directory, file) => {
  const fromDirectory = relative(directory, file);
  return fromDirectory !== '' && !fromDirectory.startsWith('..') && !isAbsolute(fromDirectory);
};

export const toPosix = (path) => path.split(sep).join('/');

export const loadModuleIfPresent = async (directory, file) => {
  const path = join(directory, file);
  if (!existsSync(path)) return undefined;
  return import(`${pathToFileURL(path).href}?t=${Date.now()}`);
};

export const readProjectRoot = (prototypeDirectory, spec) => resolve(prototypeDirectory, spec?.projectRoot ?? '../..');

export const listFiles = (directory) => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !IGNORED_ENTRIES.has(entry.name))
    .flatMap((entry) => {
      const entryPath = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    });
};

export const readOptions = (argv, booleanFlags = []) => {
  const options = {};
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (booleanFlags.includes(name)) options[name] = true;
    else {
      options[name] = argv[index + 1];
      index += 1;
    }
  }
  return { options, positional };
};
