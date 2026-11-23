// Inspector body: every element that renders differently, filterable by the header chips, one expanded at a time.
import { countChangedProperties } from '../core/diff.js';
import { pluralize } from '../core/export-changes.js';
import { getChangeLines } from '../core/registry.js';
import { getVisibleChangeIndexes } from '../core/review-reducer.js';
import { createButton, createElement, createList } from './dom.js';

const createSummary = (state) => {
  if (state.measureError) return createElement('p', { className: 'rs-why rs-why--missing', text: state.measureError, attributes: { role: 'alert' } });
  if (!state.diff) return createElement('p', { className: 'rs-hint', text: state.isMeasuring ? 'Measuring both previews…' : 'Waiting for the previews to load.' });
  const elements = pluralize(state.diff.entries.length, 'element');
  const properties = pluralize(countChangedProperties(state.diff.entries), 'property', 'properties');
  return createElement('p', { className: 'rs-summary', text: `${elements} · ${properties} changed` });
};

const createPropertyRows = (entry) => createElement('ul', { className: 'rs-props' }, entry.changes.map((change) => {
  const previous = createElement('del', { text: change.from || 'none', attributes: { title: change.from } });
  const next = createElement('ins', { text: change.to || 'none', attributes: { title: change.to } });
  return createElement('li', {}, [createElement('span', { className: 'rs-prop-name', text: change.property }), previous, ' → ', next]);
}));

const createReason = (entry) => {
  if (!entry.reasons.length) return createElement('p', { className: 'rs-why rs-why--missing', text: 'No reason recorded for this change.' });
  return createElement('p', { className: 'rs-why' }, [createElement('strong', { text: 'Why: ' }), entry.reasons.join(' ')]);
};

const createChangeRow = (entry, index, state, dispatch) => {
  const isSelected = state.selectedChange === index;
  const button = createButton('', {
    className: 'rs-change-btn',
    dataset: { focusKey: `change:${index}`, changeIndex: String(index) },
    attributes: { 'aria-expanded': String(isSelected) },
  });
  button.append(
    createElement('span', { className: 'rs-num', text: String(index + 1) }),
    createElement('span', { className: 'rs-label', text: entry.label }),
    createElement('span', { className: 'rs-meta', text: pluralize(entry.changes.length, 'change') }),
  );
  button.addEventListener('click', () => dispatch({ type: 'select-change', index: isSelected ? null : index }));
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    dispatch({ type: 'step-change', offset: event.key === 'ArrowDown' ? 1 : -1 });
  });
  const item = createElement('li', { className: `rs-change${isSelected ? ' is-selected' : ''}` }, [button]);
  item.addEventListener('mouseenter', () => dispatch({ type: 'hover-change', index }));
  item.addEventListener('mouseleave', () => dispatch({ type: 'hover-change', index: null }));
  if (isSelected) item.append(createElement('div', { className: 'rs-detail' }, [createPropertyRows(entry), createReason(entry)]));
  return item;
};

const createExtras = (diff) => [['Only in After', diff.added], ['Only in Before', diff.removed]]
  .filter(([, items]) => items.length)
  .map(([title, items]) => createElement('section', { className: 'rs-extra' }, [createElement('h3', { text: title }), createList(items.map((item) => item.label))]));

const createNotes = (current, notes) => {
  const stateLines = getChangeLines(current, notes);
  const sections = [];
  if (stateLines.length) sections.push(createElement('p', { className: 'rs-hint', text: 'Summary' }), createList(stateLines));
  if (notes.shared.length) {
    sections.push(createElement('details', { className: 'rs-notes' }, [createElement('summary', { text: 'Shared across every state' }), createList(notes.shared)]));
  }
  return sections;
};

export const renderChangesPanel = ({ state, current, notes, dispatch }) => {
  const elements = [createSummary(state)];
  if (state.diff) {
    const visibleIndexes = getVisibleChangeIndexes(state.diff, state.categoryFilter);
    elements.push(createElement('ol', { className: 'rs-changes' }, visibleIndexes.map((index) => createChangeRow(state.diff.entries[index], index, state, dispatch))));
    elements.push(...createExtras(state.diff));
    const isIdentical = !state.diff.entries.length && !state.diff.added.length && !state.diff.removed.length;
    if (isIdentical) elements.push(createElement('p', { className: 'rs-empty', text: 'Before and After render the same in this state.' }));
  }
  return [...elements, ...createNotes(current, notes)];
};
