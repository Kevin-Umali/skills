import { useState } from 'react';
import { CATEGORY_LABELS, COPY_NOTICE_MS } from '../../core/constants.js';
import { countChangedProperties, countEntriesByCategory } from '../../core/diff.js';
import { buildChangeSummary, formatChangesAsMarkdown, pluralize } from '../../core/export-changes.js';
import { findState, getChangeLines } from '../../core/registry.js';
import { getVisibleChangeIndexes } from '../../core/review-reducer.js';
import { useReview } from '../review-context';
import type { DiffEntry } from '../types';

const Summary = () => {
  const { state } = useReview();
  if (state.measureError) return <p className="rs-why rs-why--missing" role="alert">{state.measureError}</p>;
  if (!state.diff) return <p className="rs-hint">{state.isMeasuring ? 'Measuring both previews…' : 'Waiting for the previews to load.'}</p>;
  const elements = pluralize(state.diff.entries.length, 'element');
  const properties = pluralize(countChangedProperties(state.diff.entries), 'property', 'properties');
  return <p className="rs-summary">{elements} · {properties} changed</p>;
};

const Tools = () => {
  const { states, state, dispatch } = useReview();
  const [notice, setNotice] = useState('');
  const hasChanges = Boolean(state.diff?.entries.length);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(formatChangesAsMarkdown(buildChangeSummary(findState(states, state.stateId), state.diff)));
      setNotice('Copied.');
    } catch {
      setNotice('Could not copy.');
    }
    setTimeout(() => setNotice(''), COPY_NOTICE_MS);
  };

  return (
    <div className="rs-tools">
      <button type="button" className="rs-btn" disabled={!hasChanges} onClick={() => dispatch({ type: 'step-change', offset: -1 })}>Previous change</button>
      <button type="button" className="rs-btn" disabled={!hasChanges} onClick={() => dispatch({ type: 'step-change', offset: 1 })}>Next change</button>
      <button type="button" className="rs-btn" disabled={!hasChanges} aria-pressed={state.isInspecting} onClick={() => dispatch({ type: 'set-inspecting', isInspecting: !state.isInspecting })}>Select on preview</button>
      <button type="button" className="rs-btn" disabled={!hasChanges} onClick={copyMarkdown}>Copy as Markdown</button>
      <span className="rs-note">{notice}</span>
    </div>
  );
};

const CategoryChips = () => {
  const { state, dispatch } = useReview();
  if (!state.diff?.entries.length) return null;
  const options = [
    { category: 'all', label: `All ${state.diff.entries.length}` },
    ...countEntriesByCategory(state.diff.entries).map(({ category, count }: { category: string; count: number }) => ({
      category,
      label: `${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]} ${count}`,
    })),
  ];
  return (
    <div className="rs-chips" role="group" aria-label="Filter changes by kind">
      {options.map(({ category, label }) => (
        <button key={category} type="button" className="rs-chip" aria-pressed={state.categoryFilter === category} onClick={() => dispatch({ type: 'set-category-filter', category })}>{label}</button>
      ))}
    </div>
  );
};

const ChangeRow = ({ entry, index }: { entry: DiffEntry; index: number }) => {
  const { state, dispatch } = useReview();
  const isSelected = state.selectedChange === index;
  return (
    <li className={`rs-change${isSelected ? ' is-selected' : ''}`} onMouseEnter={() => dispatch({ type: 'hover-change', index })} onMouseLeave={() => dispatch({ type: 'hover-change', index: null })}>
      <button
        type="button"
        className="rs-change-btn"
        data-change-index={index}
        aria-expanded={isSelected}
        ref={(element) => { if (isSelected && element && document.activeElement?.hasAttribute('data-change-index')) element.focus(); }}
        onClick={() => dispatch({ type: 'select-change', index: isSelected ? null : index })}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          dispatch({ type: 'step-change', offset: event.key === 'ArrowDown' ? 1 : -1 });
        }}
      >
        <span className="rs-num">{index + 1}</span>
        <span className="rs-label">{entry.label}</span>
        <span className="rs-meta">{pluralize(entry.changes.length, 'change')}</span>
      </button>
      {isSelected && (
        <div className="rs-detail">
          <ul className="rs-props">
            {entry.changes.map((change) => (
              <li key={change.property}>
                <span className="rs-prop-name">{change.property}</span>
                <del title={change.from}>{change.from || 'none'}</del> → <ins title={change.to}>{change.to || 'none'}</ins>
              </li>
            ))}
          </ul>
          {entry.reasons.length
            ? <p className="rs-why"><strong>Why: </strong>{entry.reasons.join(' ')}</p>
            : <p className="rs-why rs-why--missing">No reason recorded for this change.</p>}
        </div>
      )}
    </li>
  );
};

const Extras = () => {
  const { state } = useReview();
  if (!state.diff) return null;
  return (
    <>
      {([['Only in After', state.diff.added], ['Only in Before', state.diff.removed]] as const)
        .filter(([, items]) => items.length)
        .map(([title, items]) => (
          <section className="rs-extra" key={title}>
            <h3>{title}</h3>
            <ul>{items.map((item) => <li key={item.label}>{item.label}</li>)}</ul>
          </section>
        ))}
    </>
  );
};

const Notes = () => {
  const { states, notes, state } = useReview();
  const lines: string[] = getChangeLines(findState(states, state.stateId), notes);
  return (
    <>
      {lines.length > 0 && <><p className="rs-hint">Summary</p><ul>{lines.map((line) => <li key={line}>{line}</li>)}</ul></>}
      {notes.shared.length > 0 && (
        <details className="rs-notes"><summary>Shared across every state</summary><ul>{notes.shared.map((line) => <li key={line}>{line}</li>)}</ul></details>
      )}
    </>
  );
};

// Inspector tab: every element that renders differently, filterable, one expanded at a time.
export const ChangesPanel = () => {
  const { state } = useReview();
  const visibleIndexes: number[] = state.diff ? getVisibleChangeIndexes(state.diff, state.categoryFilter) : [];
  const isIdentical = state.diff && !state.diff.entries.length && !state.diff.added.length && !state.diff.removed.length;
  return (
    <>
      <Summary />
      <Tools />
      <CategoryChips />
      {state.diff && <ol className="rs-changes">{visibleIndexes.map((index) => <ChangeRow key={index} entry={state.diff!.entries[index]} index={index} />)}</ol>}
      <Extras />
      {isIdentical && <p className="rs-empty">Before and After render the same in this state.</p>}
      <Notes />
    </>
  );
};
