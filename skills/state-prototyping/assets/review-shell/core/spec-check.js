import { COMPARISON_ENABLED, DIFF_SETTLE_MAX_POLLS, DIFF_SETTLE_PAUSE_MS, DIFF_SETTLE_POLL_MS } from './constants.js';
import { computeDiff, toBaseProperty } from './diff.js';
import { hasPendingMotion, wait } from './diff-session.js';
import { describeElement, normalizeColor, readRenderedValue } from './measure.js';

export const MEASURE_MODES = ['values', 'parity'];
export const DEFAULT_FRAME_HEIGHT_PX = 900;
const FRAME_LOAD_TIMEOUT_MS = 15000;

const normalizeValue = (value) => normalizeColor(value).replace(/\s+/g, ' ').toLowerCase();
const firstFamily = (fontFamily) => fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');

const safeQuery = (root, selector) => {
  try {
    return { elements: [...root.querySelectorAll(selector)] };
  } catch (error) {
    return { error: `invalid selector: ${error.message}` };
  }
};

const safeMatches = (element, selector) => {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
};

export const appliesToState = (value, state) => (value.states?.length ? value.states.includes(state.id) : value.area === state.area);
const appliesToTheme = (value, theme) => !value.themes?.length || value.themes.includes(theme);

export const loadFrame = (container, { src, width, height = DEFAULT_FRAME_HEIGHT_PX }) =>
  new Promise((resolve, reject) => {
    const frame = container.ownerDocument.createElement('iframe');
    frame.style.cssText = `width:${width}px;height:${height}px;border:0;display:block`;
    frame.title = src;
    const timeoutId = setTimeout(() => reject(new Error(`${src} did not load in ${FRAME_LOAD_TIMEOUT_MS}ms`)), FRAME_LOAD_TIMEOUT_MS);
    frame.addEventListener('load', async () => {
      clearTimeout(timeoutId);
      const frameDocument = frame.contentDocument;
      if (!frameDocument?.body) {
        reject(new Error(`${src} has no document. Serve the folder over HTTP.`));
        return;
      }
      await frameDocument.fonts.ready;
      for (let poll = 0; poll < DIFF_SETTLE_MAX_POLLS && hasPendingMotion(frameDocument); poll += 1) await wait(DIFF_SETTLE_POLL_MS);
      await wait(DIFF_SETTLE_PAUSE_MS);
      resolve(frameDocument);
    }, { once: true });
    frame.src = src;
    container.append(frame);
  });

const checkFonts = async (frameDocument, elements) => {
  const failures = [...frameDocument.fonts]
    .filter((face) => face.status === 'error')
    .map((face) => ({ kind: 'font', font: `${face.family} ${face.weight} ${face.style}`, problem: 'failed to load' }));
  const declaredFamilies = new Set([...frameDocument.fonts].map((face) => firstFamily(face.family)));
  const failedFamilies = new Set([...frameDocument.fonts].filter((face) => face.status === 'error').map((face) => firstFamily(face.family)));
  const fontStrings = new Set(elements.map((element) => {
    const style = frameDocument.defaultView.getComputedStyle(element);
    return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  }));
  for (const font of fontStrings) {
    const family = firstFamily(font.split(/\s+/).slice(3).join(' '));
    const isSystemFont = !declaredFamilies.has(family);
    const isAlreadyReported = failedFamilies.has(family);
    if (isSystemFont || isAlreadyReported) continue;
    try {
      const loadedFaces = await frameDocument.fonts.load(font);
      if (!loadedFaces.length) failures.push({ kind: 'font', font, problem: 'no face loaded, so a fallback font renders' });
    } catch (error) {
      failures.push({ kind: 'font', font, problem: error.message });
    }
  }
  return failures;
};

export const checkValues = async (afterDocument, { state, theme }, values) => {
  const failures = [];
  const checkedElements = [];
  let checked = 0;
  values.filter((value) => appliesToState(value, state) && appliesToTheme(value, theme)).forEach((value) => {
    const { elements, error } = safeQuery(afterDocument, value.selector);
    if (error || !elements.length) {
      failures.push({ kind: 'value', area: value.area, selector: value.selector, problem: error ?? 'matched nothing in the After' });
      return;
    }
    elements.forEach((element) => {
      checkedElements.push(element);
      Object.entries(value.expected ?? {}).forEach(([property, expected]) => {
        checked += 1;
        const actual = readRenderedValue(element, property);
        if (normalizeValue(actual) !== normalizeValue(expected)) {
          failures.push({ kind: 'value', area: value.area, selector: value.selector, element: describeElement(element), property, expected: String(expected), actual });
        }
      });
    });
  });
  return { checked, failures: [...failures, ...(await checkFonts(afterDocument, checkedElements))] };
};

const isAllowed = (element, differences, property) =>
  differences.some((difference) => safeMatches(element, difference.selector)
    && (property === undefined ? !difference.props?.length : !difference.props?.length || difference.props.some((allowed) => toBaseProperty(allowed) === toBaseProperty(property))));

export const checkParity = (beforeDocument, afterDocument, differences) => {
  const diff = computeDiff(beforeDocument, afterDocument);
  const changed = diff.entries.flatMap((entry) => entry.changes
    .filter((change) => !isAllowed(entry.afterElement, differences, change.property))
    .map((change) => ({ kind: 'parity', element: entry.label, key: entry.key, property: change.property, before: change.from, after: change.to })));
  const added = diff.added
    .filter((item) => !isAllowed(item.afterElement, differences))
    .map((item) => ({ kind: 'parity', element: item.label, problem: 'only in After' }));
  const removed = diff.removed
    .filter((item) => !isAllowed(item.beforeElement, differences))
    .map((item) => ({ kind: 'parity', element: item.label, problem: 'only in Before' }));
  const checked = afterDocument.body.querySelectorAll('*').length;
  return { checked, failures: [...changed, ...added, ...removed] };
};

export const readMeasureParams = (search) => {
  const params = new URLSearchParams(search);
  return {
    mode: MEASURE_MODES.includes(params.get('mode')) ? params.get('mode') : 'values',
    stateId: params.get('state'),
    theme: params.get('theme') === 'dark' ? 'dark' : 'light',
    width: Number(params.get('width')) || 1100,
    height: Number(params.get('height')) || DEFAULT_FRAME_HEIGHT_PX,
  };
};

const frameUrl = (side, state, theme) => `${side}/frame.html?${new URLSearchParams({ state: state.id, theme })}`;

export const runMeasure = async ({ container, states, spec, params }) => {
  const { mode, stateId, theme, width, height } = params;
  const state = states.find((candidate) => candidate.id === stateId) ?? states[0];
  const base = { mode, state: state?.id ?? null, theme, width };
  if (!state) return { ...base, pass: false, checked: 0, failures: [{ kind: 'setup', problem: 'states.js has no states' }] };
  if (mode === 'parity' && !COMPARISON_ENABLED) {
    return { ...base, pass: false, checked: 0, failures: [{ kind: 'setup', problem: 'parity needs a Before; this prototype is single-preview' }] };
  }
  try {
    if (mode === 'values') {
      const afterDocument = await loadFrame(container, { src: frameUrl('after', state, theme), width, height });
      const result = await checkValues(afterDocument, { state, theme }, spec.values ?? []);
      return { ...base, pass: !result.failures.length, ...result };
    }
    const [beforeDocument, afterDocument] = await Promise.all(['before', 'after'].map((side) => loadFrame(container, { src: frameUrl(side, state, theme), width, height })));
    const result = checkParity(beforeDocument, afterDocument, spec.differences ?? []);
    return { ...base, pass: !result.failures.length, ...result };
  } catch (error) {
    return { ...base, pass: false, checked: 0, failures: [{ kind: 'setup', problem: error.message }] };
  }
};
