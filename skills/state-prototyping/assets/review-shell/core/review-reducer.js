// One reducer for the whole shell. The vanilla store and the React useReducer both run it,
// so the two starters cannot drift apart in behavior.
import { CHANGES_ACTIVE } from './constants.js';
import { clampSplit } from './slider.js';
import { getAdjacentState } from './registry.js';

// `view` comes from readViewFromSearch: stateId, theme, width, compare, split, highlight, sidebar and inspector flags, selectedChange.
export const createInitialState = (view) => ({
  ...view,
  query: '',
  resetCount: 0,
  diff: null,
  isMeasuring: false,
  measureError: null,
  hoveredChange: null,
  linkedChanges: [], // changes a collapsed badge stands for, marked in the inspector list while it is hovered
  categoryFilter: 'all',
  isInspecting: false,
  popover: null, // 'details' | 'share' | 'legend' | 'copy-link' | null
});

// Everything measured is stale once the previews show something else.
const clearedChanges = { diff: null, isMeasuring: false, measureError: null, selectedChange: null, hoveredChange: null, linkedChanges: [] };

// After a re-measure, keep the selected change selected if the same element still differs.
// A change index that came from the URL has no earlier diff to match, so it is kept when it is still in range.
const resolveSelection = (state, nextDiff) => {
  if (!state.diff) return state.selectedChange !== null && state.selectedChange < nextDiff.entries.length ? state.selectedChange : null;
  const selectedKey = state.diff.entries[state.selectedChange]?.key;
  const nextIndex = selectedKey ? nextDiff.entries.findIndex((entry) => entry.key === selectedKey) : -1;
  return nextIndex === -1 ? null : nextIndex;
};

export const getVisibleChangeIndexes = (diff, categoryFilter) =>
  (diff?.entries ?? [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => categoryFilter === 'all' || entry.categories.includes(categoryFilter))
    .map(({ index }) => index);

// With changes off nothing is measured or highlighted, so these actions (a hidden control, a stray event) change nothing.
const CHANGE_ACTIONS = new Set([
  'toggle-highlight', 'measuring', 'diff-ready', 'diff-failed', 'select-change', 'hover-change',
  'link-changes', 'step-change', 'set-category-filter', 'set-inspecting', 'set-inspector',
]);

export const reviewReducer = (state, action) => {
  if (!CHANGES_ACTIVE && CHANGE_ACTIONS.has(action.type)) return state;
  switch (action.type) {
    case 'select-state':
      return {
        ...state,
        stateId: action.stateId,
        // Picking a state in the overlay sidebar closes it. That close is not a choice worth keeping in the URL.
        ...(action.closesSidebar ? { isSidebarOpen: false, sidebarChosen: false } : {}),
        ...clearedChanges,
      };
    case 'set-view':
      return { ...state, [action.key]: action.value, ...(action.key === 'compare' ? { compareChosen: true } : {}), ...clearedChanges };
    case 'set-split':
      return { ...state, split: clampSplit(action.value) };
    case 'toggle-highlight':
      return { ...state, highlight: !state.highlight };
    case 'set-query':
      return { ...state, query: action.query };
    case 'reset-preview':
      return { ...state, resetCount: state.resetCount + 1, ...clearedChanges };
    case 'measuring':
      // Keep the last diff and selection while measuring again, so using a preview does not reset the reviewer's place.
      return { ...state, isMeasuring: true, measureError: null };
    case 'diff-ready':
      return { ...state, isMeasuring: false, measureError: null, diff: action.diff, selectedChange: resolveSelection(state, action.diff) };
    case 'diff-failed':
      return { ...state, isMeasuring: false, diff: null, selectedChange: null, hoveredChange: null, linkedChanges: [], measureError: action.message };
    case 'select-change':
      return { ...state, selectedChange: action.index, hoveredChange: null, linkedChanges: [] };
    case 'hover-change':
      return { ...state, hoveredChange: action.index };
    case 'link-changes': {
      const indexes = action.indexes ?? [];
      return indexes.join() === state.linkedChanges.join() ? state : { ...state, linkedChanges: indexes };
    }
    case 'step-change': {
      const visibleIndexes = getVisibleChangeIndexes(state.diff, state.categoryFilter);
      if (!visibleIndexes.length) return state;
      const position = visibleIndexes.indexOf(state.selectedChange);
      const nextPosition = position === -1
        ? (action.offset > 0 ? 0 : visibleIndexes.length - 1)
        : (position + action.offset + visibleIndexes.length) % visibleIndexes.length;
      return { ...state, selectedChange: visibleIndexes[nextPosition] };
    }
    case 'set-category-filter':
      return { ...state, categoryFilter: action.category, selectedChange: null, linkedChanges: [] };
    case 'set-inspecting':
      return { ...state, isInspecting: action.isInspecting, isInspectorOpen: action.isInspecting ? true : state.isInspectorOpen };
    case 'set-inspector':
      return { ...state, isInspectorOpen: action.isOpen, ...(action.isOpen ? {} : { isInspecting: false }) };
    case 'set-sidebar':
      return { ...state, isSidebarOpen: action.isOpen, sidebarChosen: Boolean(action.isUserChoice) };
    case 'set-popover':
      return { ...state, popover: action.popover };
    default:
      return state;
  }
};

export const selectAdjacentStateId = (states, stateId, offset) => getAdjacentState(states, stateId, offset)?.id ?? null;
