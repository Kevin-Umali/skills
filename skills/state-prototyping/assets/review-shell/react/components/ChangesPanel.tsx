// Inspector body: every element that renders differently, filterable by the header chips, one expanded at a time.
import { countChangedProperties } from '../../core/diff.js';
import { pluralize } from '../../core/export-changes.js';
import { getChangeLines } from '../../core/registry.js';
import { getVisibleChangeIndexes } from '../../core/review-reducer.js';
import { useReview } from '../review-context';
import type { DiffEntry, PrototypeState, ReviewState } from '../types';

const Summary = ({ state }: { state: ReviewState }) => {
  if (state.measureError) return <p className="rs-why rs-why--missing" role="alert">{state.measureError}</p>;
  if (!state.diff) return <p className="rs-hint">{state.isMeasuring ? 'Measuring both previews…' : 'Waiting for the previews to load.'}</p>;
  const elements = pluralize(state.diff.entries.length, 'element');
  const properties = pluralize(countChangedProperties(state.diff.entries), 'property', 'properties');
  return <p className="rs-summary">{`${elements} · ${properties} changed`}</p>;
};

const TextList = ({ items }: { items: string[] }) => <ul>{items.map((text) => <li key={text}>{text}</li>)}</ul>;

const ChangeRow = ({ entry, index, isSelected, isLinked }: { entry: DiffEntry; index: number; isSelected: boolean; isLinked: boolean }) => {
  const { store } = useReview();
  const { dispatch } = store;
  return (
    <li className={`rs-change${isSelected ? ' is-selected' : ''}${isLinked ? ' is-linked' : ''}`} onMouseEnter={() => dispatch({ type: 'hover-change', index })} onMouseLeave={() => dispatch({ type: 'hover-change', index: null })}>
      <button
        type="button"
        className="rs-change-btn"
        data-focus-key={`change:${index}`}
        data-change-index={index}
        aria-expanded={isSelected}
        onClick={() => dispatch({ type: 'select-change', index: isSelected ? null : index })}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          dispatch({ type: 'step-change', offset: event.key === 'ArrowDown' ? 1 : -1 });
        }}
      >
        <span className="rs-num">{String(index + 1)}</span>
        <span className="rs-label">{entry.label}</span>
        <span className="rs-meta">{pluralize(entry.changes.length, 'change')}</span>
      </button>
      {isSelected && (
        <div className="rs-detail">
          <ul className="rs-props">
            {entry.changes.map((change) => (
              <li key={change.property}>
                <span className="rs-prop-name">{change.property}</span>
                <del title={change.from}>{change.from || 'none'}</del>{' → '}<ins title={change.to}>{change.to || 'none'}</ins>
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

const Extras = ({ diff }: { diff: NonNullable<ReviewState['diff']> }) => (
  <>
    {([['Only in After', diff.added], ['Only in Before', diff.removed]] as const)
      .filter(([, items]) => items.length)
      .map(([title, items]) => <section className="rs-extra" key={title}><h3>{title}</h3><TextList items={items.map((item) => item.label)} /></section>)}
  </>
);

const Notes = ({ current }: { current: PrototypeState }) => {
  const { notes } = useReview();
  const stateLines: string[] = getChangeLines(current, notes);
  return (
    <>
      {stateLines.length > 0 && <><p className="rs-hint">Summary</p><TextList items={stateLines} /></>}
      {notes.shared.length > 0 && <details className="rs-notes"><summary>Shared across every state</summary><TextList items={notes.shared} /></details>}
    </>
  );
};

export const ChangesPanel = ({ state, current }: { state: ReviewState; current: PrototypeState }) => {
  const { diff } = state;
  const visibleIndexes: number[] = diff ? getVisibleChangeIndexes(diff, state.categoryFilter) : [];
  const isIdentical = diff && !diff.entries.length && !diff.added.length && !diff.removed.length;
  return (
    <>
      <Summary state={state} />
      {diff && <ol className="rs-changes">{visibleIndexes.map((index) => <ChangeRow key={index} entry={diff.entries[index]} index={index} isSelected={state.selectedChange === index} isLinked={state.linkedChanges.includes(index)} />)}</ol>}
      {diff && <Extras diff={diff} />}
      {isIdentical && <p className="rs-empty">Before and After render the same in this state.</p>}
      <Notes current={current} />
    </>
  );
};
