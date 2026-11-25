#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getOptionValues } from '../assets/review-shell/core/controls.js';
import { appliesToState } from '../assets/review-shell/core/spec-check.js';
import { loadModuleIfPresent, readOptions, readProjectRoot } from './lib/prototype-files.mjs';
import { servePrototype } from './lib/serve-prototype.mjs';

const MODES = ['values', 'parity'];
const DEFAULT_THEMES = ['light', 'dark'];
const DEFAULT_WIDTHS = getOptionValues('width').filter((value) => value !== 'fit').map(Number);
const PLAYWRIGHT_PACKAGES = ['playwright', '@playwright/test', 'playwright-core'];
const RESULT_TIMEOUT_MS = 30000;
const EXIT_COULD_NOT_RUN = 1;
const EXIT_FAILURES = 2;

const HELP = `Usage: node measure-prototype.mjs <prototype-dir> --mode ${MODES.join('|')} [--url <measure.html URL>] [--states a,b] [--themes light,dark] [--widths ${DEFAULT_WIDTHS.join(',')}]

values  the After renders every spec.values entry for the state, and its fonts loaded. An area locks only when this passes.
parity  Before and After differ only where spec.differences allows. Used when applying the prototype.
--url   an already served measure.html. Without it the script serves the prototype itself (vite.config.mjs, else static).
        Needs Playwright in the project; without it the URLs are printed to open by hand.
Defaults: states with a spec value (values) or every state (parity), themes ${DEFAULT_THEMES.join(',')}, widths ${DEFAULT_WIDTHS.join(',')}.

Prints JSON. Exit codes: 0 all passed (or URLs printed), ${EXIT_FAILURES} failures, ${EXIT_COULD_NOT_RUN} could not run.`;

const fail = (message, code = EXIT_COULD_NOT_RUN) => {
  console.error(`Error: ${message}`);
  process.exit(code);
};

const { options, positional } = readOptions(process.argv.slice(2), ['help']);
if (options.help) {
  console.log(HELP);
  process.exit(0);
}
const [prototypeArgument] = positional;
if (!prototypeArgument) fail(`a prototype folder is required.\n${HELP}`);
if (!MODES.includes(options.mode)) fail(`--mode must be one of: ${MODES.join(', ')}.`);

const prototypeDirectory = resolve(prototypeArgument);
const [statesModule, spec] = await Promise.all([loadModuleIfPresent(prototypeDirectory, 'states.js'), loadModuleIfPresent(prototypeDirectory, 'spec.js')]);
if (!statesModule || !spec) fail(`${prototypeDirectory} needs states.js and spec.js. Run init-prototype.mjs first.`);
if (!existsSync(join(prototypeDirectory, 'measure.html'))) fail(`${prototypeDirectory} has no measure.html. Rerun init-prototype.mjs.`);

const splitList = (value) => value?.split(',').map((item) => item.trim()).filter(Boolean);
const states = statesModule.states ?? [];
const values = spec.values ?? [];
const defaultStates = options.mode === 'values' ? states.filter((state) => values.some((value) => appliesToState(value, state))) : states;
const stateIds = splitList(options.states) ?? defaultStates.map((state) => state.id);
const unknownStates = stateIds.filter((id) => !states.some((state) => state.id === id));
if (unknownStates.length) fail(`unknown state id(s): ${unknownStates.join(', ')}.`);
if (options.mode === 'values' && !stateIds.length) fail('No spec.values apply to these states. Add the numbers the After must render.', EXIT_FAILURES);
const themes = splitList(options.themes) ?? DEFAULT_THEMES;
const widths = (splitList(options.widths) ?? DEFAULT_WIDTHS).map(Number);

const runs = stateIds.flatMap((state) => themes.flatMap((theme) => widths.map((width) => ({ state, theme, width }))));
const toQuery = (run) => `?${new URLSearchParams({ mode: options.mode, state: run.state, theme: run.theme, width: String(run.width) })}`;

const loadPlaywright = async () => {
  const projectRequire = createRequire(join(readProjectRoot(prototypeDirectory, spec), 'package.json'));
  for (const name of PLAYWRIGHT_PACKAGES) {
    try {
      const module = await import(pathToFileURL(projectRequire.resolve(name)).href);
      const chromium = module.chromium ?? module.default?.chromium;
      if (chromium) return { name, chromium };
    } catch {}
  }
  return undefined;
};

const printUrls = (reason) => {
  console.log(JSON.stringify({
    mode: options.mode,
    headless: false,
    reason,
    urls: runs.map((run) => `${options.url ?? 'measure.html'}${toQuery(run)}`),
    next: 'Open each URL: its title becomes measure:pass or measure:fail and #measure-result holds the JSON. An area locks only when every values run passes.',
  }, null, 2));
};

const describeFailure = (failure) => {
  if (failure.property && failure.before !== undefined) return `${failure.property} ${failure.before} → ${failure.after}`;
  if (failure.property) return `${failure.property} ${failure.actual}, expected ${failure.expected}`;
  return failure.problem;
};

const groupFailures = (results) => {
  const groups = new Map();
  results.filter((result) => !result.pass).forEach((result) => result.failures.forEach((failure) => {
    const target = failure.key ?? failure.selector ?? failure.font ?? '';
    const groupKey = `${failure.kind} ${target}`;
    if (!groups.has(groupKey)) groups.set(groupKey, { kind: failure.kind, element: failure.element ?? failure.selector ?? failure.font, problems: new Set(), states: new Set(), runs: new Set() });
    const group = groups.get(groupKey);
    group.problems.add(describeFailure(failure));
    group.states.add(result.state);
    group.runs.add(`${result.state} ${result.theme} ${result.width}`);
  }));
  return [...groups.values()].map((group) => ({ ...group, problems: [...group.problems], states: [...group.states], runs: group.runs.size }));
};

const playwright = await loadPlaywright();
if (!playwright) {
  printUrls(`Playwright is not installed in the project (looked for ${PLAYWRIGHT_PACKAGES.join(', ')}). Serve the project and open the URLs.`);
  process.exit(0);
}

let browser;
try {
  browser = await playwright.chromium.launch();
} catch (error) {
  printUrls(`${playwright.name} is installed but Chromium did not launch: ${error.message.split('\n')[0]}`);
  process.exit(0);
}

const served = options.url ? { url: options.url, close: () => {}, kind: 'given' } : await servePrototype(readProjectRoot(prototypeDirectory, spec), prototypeDirectory);
const page = await browser.newPage({ viewport: { width: Math.max(...widths) + 64, height: 1000 } });
const results = [];
for (const run of runs) {
  try {
    await page.goto(`${served.url}${toQuery(run)}`);
    await page.waitForFunction(() => /^measure:(pass|fail|error)$/.test(document.title), undefined, { timeout: RESULT_TIMEOUT_MS });
    const result = (await page.title()) === 'measure:error'
      ? { ...run, pass: false, failures: [{ kind: 'setup', problem: await page.textContent('#summary') }] }
      : await page.evaluate(() => window.measureResult);
    results.push(result);
  } catch (error) {
    results.push({ ...run, pass: false, failures: [{ kind: 'setup', problem: error.message.split('\n')[0] }] });
  }
}
await browser.close();
await served.close();

const failedRuns = results.filter((result) => !result.pass).length;
console.log(JSON.stringify({
  mode: options.mode,
  served: served.kind,
  runs: results.length,
  passed: results.length - failedRuns,
  failed: failedRuns,
  failures: groupFailures(results),
}, null, 2));
if (failedRuns) process.exit(EXIT_FAILURES);
