// Right inspector: docked on wide windows, a bottom sheet under the previews on narrower ones.
// Its header holds the count, the highlight toggle, filter chips and change stepping; its body lists the changes.
import { CATEGORY_LABELS, CHANGES_ACTIVE } from '../core/constants.js';
import { countEntriesByCategory } from '../core/diff.js';
import { pluralize } from '../core/export-changes.js';
import { findState } from '../core/registry.js';
import { renderChangesPanel } from './changes-panel.js';
import { byId, createButton, createChangeDetector, renderKeepingFocus } from './dom.js';

export const createInspector = ({ states, notes, dispatch }) => {
  const body = byId('rs-inspector-body');
  const chipsElement = byId('rs-chips');
  const liveRegion = byId('rs-live');
  const hasBodyChanged = createChangeDetector();
  const hasSelectionChanged = createChangeDetector();
  const hasHeaderChanged = createChangeDetector();
  const haveLinksChanged = createChangeDetector();

  const highlightButton = byId('rs-highlight');
  const inspectButton = byId('rs-inspect');
  const previousButton = byId('rs-previous-change');
  const nextButton = byId('rs-next-change');

  highlightButton.addEventListener('click', () => dispatch({ type: 'toggle-highlight' }));
  byId('rs-close-inspector').addEventListener('click', () => dispatch({ type: 'set-inspector', isOpen: false }));
  previousButton.addEventListener('click', () => dispatch({ type: 'step-change', offset: -1 }));
  nextButton.addEventListener('click', () => dispatch({ type: 'step-change', offset: 1 }));
  inspectButton.addEventListener('click', (event) => dispatch({ type: 'set-inspecting', isInspecting: event.currentTarget.getAttribute('aria-pressed') !== 'true' }));

  const announceSelection = (state) => {
    if (!hasSelectionChanged(state.selectedChange)) return;
    const entry = state.diff?.entries[state.selectedChange];
    if (!entry) return;
    liveRegion.textContent = `Change ${state.selectedChange + 1} of ${state.diff.entries.length}: ${entry.label}, ${pluralize(entry.changes.length, 'change')}.`;
  };

  const renderChips = (state) => {
    const entries = state.diff?.entries ?? [];
    const options = entries.length
      ? [{ category: 'all', label: `All ${entries.length}` }, ...countEntriesByCategory(entries).map(({ category, count }) => ({ category, label: `${CATEGORY_LABELS[category]} ${count}` }))]
      : [];
    chipsElement.hidden = !options.length;
    chipsElement.replaceChildren(...options.map(({ category, label }) => {
      const chip = createButton(label, { className: 'rs-chip', dataset: { value: category }, attributes: { 'aria-pressed': String(state.categoryFilter === category) } });
      chip.addEventListener('click', () => dispatch({ type: 'set-category-filter', category }));
      return chip;
    }));
  };

  const renderHeader = (state) => {
    const hasChanges = Boolean(state.diff?.entries.length);
    byId('rs-insp-count').textContent = hasChanges ? String(state.diff.entries.length) : '';
    highlightButton.setAttribute('aria-pressed', String(state.highlight));
    inspectButton.setAttribute('aria-pressed', String(state.isInspecting));
    [previousButton, nextButton, inspectButton].forEach((button) => { button.disabled = !hasChanges; });
    if (hasHeaderChanged(state.diff, state.categoryFilter)) renderChips(state);
  };

  // A hovered group badge marks the rows of the changes it stands for.
  const syncLinkedRows = (state) => {
    const linked = new Set(state.linkedChanges);
    const rows = [...body.querySelectorAll('.rs-change')];
    rows.forEach((row) => row.classList.toggle('is-linked', linked.has(Number(row.querySelector('[data-change-index]').dataset.changeIndex))));
    if (haveLinksChanged(state.linkedChanges.join())) rows.find((row) => row.classList.contains('is-linked'))?.scrollIntoView({ block: 'nearest' });
  };

  const render = (state) => {
    if (!CHANGES_ACTIVE || !state.isInspectorOpen) return;
    announceSelection(state);
    renderHeader(state);
    if (!hasBodyChanged(state.stateId, state.diff, state.isMeasuring, state.measureError, state.selectedChange, state.categoryFilter, state.isInspecting)) {
      syncLinkedRows(state);
      return;
    }
    const panel = renderChangesPanel({ state, current: findState(states, state.stateId), notes, dispatch });
    const hadChangeFocus = body.contains(document.activeElement) && document.activeElement.dataset.changeIndex !== undefined;
    renderKeepingFocus(body, () => body.replaceChildren(...panel));
    // Arrow keys move the selection, so keyboard focus follows it.
    if (hadChangeFocus && state.selectedChange !== null) body.querySelector(`[data-focus-key="change:${state.selectedChange}"]`)?.focus();
    body.querySelector('.rs-change.is-selected')?.scrollIntoView({ block: 'nearest' });
    syncLinkedRows(state);
  };

  return { render };
};
