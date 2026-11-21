// Right inspector: a docked column on wide windows, a drawer on narrower ones. It lists every change.
import { pluralize } from '../core/export-changes.js';
import { findState } from '../core/registry.js';
import { renderChangesPanel } from './changes-panel.js';
import { byId, renderKeepingFocus } from './dom.js';

const objectIds = new WeakMap();
let nextObjectId = 1;
const getObjectId = (object) => {
  if (!object) return 0;
  if (!objectIds.has(object)) objectIds.set(object, nextObjectId++);
  return objectIds.get(object);
};

export const createInspector = ({ states, notes, dispatch }) => {
  const root = byId('rs-root');
  const body = byId('rs-inspector-body');
  const liveRegion = byId('rs-live');
  let previousKey = '';
  let previousSelection = null;

  byId('rs-close-inspector').addEventListener('click', () => dispatch({ type: 'set-inspector', isOpen: false }));

  const announceSelection = (state) => {
    if (state.selectedChange === previousSelection) return;
    previousSelection = state.selectedChange;
    const entry = state.diff?.entries[state.selectedChange];
    if (!entry) return;
    liveRegion.textContent = `Change ${state.selectedChange + 1} of ${state.diff.entries.length}: ${entry.label}, ${pluralize(entry.changes.length, 'change')}.`;
  };

  const render = (state) => {
    root.dataset.inspector = state.isInspectorOpen ? 'open' : 'closed';
    announceSelection(state);
    const key = [state.isInspectorOpen, state.stateId, getObjectId(state.diff), state.isMeasuring, state.selectedChange, state.categoryFilter, state.isInspecting].join('|');
    if (key === previousKey) return;
    previousKey = key;
    const panel = renderChangesPanel({ state, current: findState(states, state.stateId), notes, dispatch });
    const hadChangeFocus = body.contains(document.activeElement) && document.activeElement.dataset.changeIndex !== undefined;
    renderKeepingFocus(body, () => body.replaceChildren(...panel));
    // Arrow keys move the selection, so keyboard focus follows it.
    if (hadChangeFocus && state.selectedChange !== null) body.querySelector(`[data-focus-key="change:${state.selectedChange}"]`)?.focus();
    body.querySelector('.rs-change.is-selected')?.scrollIntoView({ block: 'nearest' });
  };

  return { render };
};
