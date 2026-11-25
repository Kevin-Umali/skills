#!/usr/bin/env node
// PostToolUse hook: runs check-prototype on the prototype an edit touched and reports its errors.
// Reads the hook JSON on stdin. Claude Code sends tool_input.file_path; Codex sends an apply_patch body in tool_input.command.
// Exit 2 with errors on stderr feeds them back to the model in both harnesses; anything else stays silent.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXIT_FEEDBACK = 2;
const PROTOTYPE_MARKERS = ['spec.js', 'states.js'];
const PATCH_FILE_LINE = /^\*\*\* (?:Add|Update) File: (.+)$/gm;
const CHECK_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-prototype.mjs');

const readInput = () => {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
};

const listEditedFiles = ({ tool_input: toolInput = {}, cwd = process.cwd() }) => {
  const patchFiles = typeof toolInput.command === 'string' ? [...toolInput.command.matchAll(PATCH_FILE_LINE)].map((match) => match[1].trim()) : [];
  const directFiles = [toolInput.file_path, toolInput.path].filter((file) => typeof file === 'string');
  return [...directFiles, ...patchFiles].map((file) => resolve(cwd, file));
};

const findPrototype = (file) => {
  let directory = dirname(file);
  while (directory !== dirname(directory)) {
    if (PROTOTYPE_MARKERS.every((marker) => existsSync(join(directory, marker)))) return directory;
    directory = dirname(directory);
  }
  return undefined;
};

const checkPrototype = (prototypeDirectory) => {
  const run = spawnSync(process.execPath, [CHECK_SCRIPT, prototypeDirectory], { encoding: 'utf8' });
  try {
    return JSON.parse(run.stdout).errors ?? [];
  } catch {
    return [run.stderr.trim() || `check-prototype exited ${run.status}`];
  }
};

const input = readInput();
const prototypes = [...new Set(listEditedFiles(input).map(findPrototype).filter(Boolean))];
const problems = prototypes.flatMap((prototypeDirectory) => checkPrototype(prototypeDirectory).map((error) => `${relative(input.cwd ?? process.cwd(), prototypeDirectory) || '.'}: ${error}`));
if (problems.length) {
  console.error(`check-prototype found problems after this edit:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
  process.exit(EXIT_FEEDBACK);
}
