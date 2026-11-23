// Right inspector: docked on wide windows, a bottom sheet under the previews on narrower ones.
// Its header holds the count, the highlight toggle, filter chips and change stepping; its body lists the changes.
import { useEffect, useRef } from 'react';
import { CATEGORY_LABELS, CHANGES_ACTIVE } from '../../core/constants.js';
import { countEntriesByCategory } from '../../core/diff.js';
import { pluralize } from '../../core/export-changes.js';
import { findState } from '../../core/registry.js';
import { useReview, useReviewPart } from '../review-context';
import { ChangesPanel } from './ChangesPanel';
import { Icon } from './Icon';

export const Inspector = () => {
  const { states, store } = useReview();
  const state = useReviewPart('inspector');
  const bodyRef = useRef<HTMLDivElement>(null);
  const announcedChange = useRef<number | null | undefined>(undefined);
  const { dispatch } = store;
  const isOpen = CHANGES_ACTIVE && state.isInspectorOpen;
  const entries = state.diff?.entries ?? [];
  const hasChanges = entries.length > 0;
  const chipOptions = hasChanges
    ? [{ category: 'all', label: `All ${entries.length}` }, ...countEntriesByCategory(entries).map(({ category, count }: { category: string; count: number }) => ({ category, label: `${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]} ${count}` }))]
    : [];

  // The selection is said once, when it changes while the inspector is open.
  useEffect(() => {
    if (!isOpen || announcedChange.current === state.selectedChange) return;
    announcedChange.current = state.selectedChange;
    const entry = state.selectedChange === null ? undefined : entries[state.selectedChange];
    if (entry && state.selectedChange !== null) store.announce(`Change ${state.selectedChange + 1} of ${entries.length}: ${entry.label}, ${pluralize(entry.changes.length, 'change')}.`);
  }, [isOpen, state.selectedChange, state.diff]);

  // Arrow keys move the selection, so keyboard focus follows it, and the selected row stays in view.
  useEffect(() => {
    const body = bodyRef.current;
    if (!isOpen || !body) return;
    const focused = document.activeElement as HTMLElement | null;
    if (body.contains(focused) && focused?.dataset.changeIndex !== undefined && state.selectedChange !== null) {
      body.querySelector<HTMLElement>(`[data-focus-key="change:${state.selectedChange}"]`)?.focus();
    }
    body.querySelector('.rs-change.is-selected')?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, state.stateId, state.diff, state.isMeasuring, state.measureError, state.selectedChange, state.categoryFilter, state.isInspecting]);

  // A hovered group badge marks the rows of the changes it stands for; the first one is kept in view.
  useEffect(() => {
    if (!isOpen || !state.linkedChanges.length) return;
    bodyRef.current?.querySelector(`[data-change-index="${state.linkedChanges[0]}"]`)?.closest('.rs-change')?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, state.linkedChanges]);

  return (
    <aside className="rs-inspector" id="rs-inspector" data-region="inspector" data-feature="changes" aria-label="Changes">
      <div className="rs-insp-head">
        <div className="rs-insp-row">
          <h2 className="rs-insp-title">Changes <span className="rs-count-badge" id="rs-insp-count">{isOpen && hasChanges ? String(entries.length) : ''}</span></h2>
          <button type="button" className="rs-btn" id="rs-highlight" aria-pressed={state.highlight} onClick={() => dispatch({ type: 'toggle-highlight' })}>Highlight</button>
          <button type="button" className="rs-icon-btn" id="rs-close-inspector" aria-label="Close changes" onClick={() => dispatch({ type: 'set-inspector', isOpen: false })}><Icon name="close" /></button>
        </div>
        <div className="rs-chips" id="rs-chips" role="group" aria-label="Filter changes by kind" hidden={isOpen && !chipOptions.length}>
          {isOpen && chipOptions.map(({ category, label }: { category: string; label: string }) => (
            <button key={category} type="button" className="rs-chip" data-value={category} aria-pressed={state.categoryFilter === category} onClick={() => dispatch({ type: 'set-category-filter', category })}>{label}</button>
          ))}
        </div>
        <div className="rs-insp-row">
          <button type="button" className="rs-btn" id="rs-previous-change" disabled={isOpen && !hasChanges} onClick={() => dispatch({ type: 'step-change', offset: -1 })}>Previous</button>
          <button type="button" className="rs-btn" id="rs-next-change" disabled={isOpen && !hasChanges} onClick={() => dispatch({ type: 'step-change', offset: 1 })}>Next</button>
          <button type="button" className="rs-btn" id="rs-inspect" aria-pressed={state.isInspecting} disabled={isOpen && !hasChanges} onClick={() => dispatch({ type: 'set-inspecting', isInspecting: !store.getState().isInspecting })}>Select on preview</button>
        </div>
      </div>
      <div className="rs-insp-body" id="rs-inspector-body" ref={bodyRef}>
        {isOpen && <ChangesPanel state={state} current={findState(states, state.stateId)} />}
      </div>
    </aside>
  );
};
