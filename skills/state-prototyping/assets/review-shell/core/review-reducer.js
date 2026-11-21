// One reducer for the whole shell. The vanilla store and the React useReducer both run it,
// so the two starters cannot drift apart in behavior.
import { getAdjacentState } from './registry.js';

export const createInitialState = (view) => ({
  ...view,
  query: '',
  collapsedAreaIds: [],
  resetCount: 0,
  diff: null,
  isMeasuring: false,
  measureError: null,
  selectedChange: null,
  hoveredChange: null,
  categoryFilter: 'all',
  isInspecting: false,
  isInspectorOpen: false,
  popover: null,
});

// Everything measured is stale once the previews show something else.
const clearedChanges = { diff: null, isMeasuring: false, measureError: null, selectedChange: null, hoveredChange: null };

// After a re-measure, keep the selected change selected if the same element still differs.
const findSameChange = (state, nextDiff) => {
  const selectedKey = state.diff?.entries[state.selectedChange]?.key;
  const nextIndex = selectedKey ? nextDiff.entries.findIndex((entry) => entry.key === selectedKey) : -1;
  return nextIndex === -1 ? null : nextIndex;
};

const toggleItem = (items, item) => (items.includes(item) ? items.filter((existing) => existing !== item) : [...items, item]);

const getVisibleChangeIndexes = (diff, categoryFilter) =>
  (diff?.entries ?? [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => categoryFilter === 'all' || entry.categories.includes(categoryFilter))
    .map(({ index }) => index);

export const reviewReducer = (state, action) => {
  switch (action.type) {
    case 'select-state':
      return {
        ...state,
        stateId: action.stateId,
        collapsedAreaIds: state.collapsedAreaIds.filter((areaId) => areaId !== action.areaId),
        ...clearedChanges,
      };
    case 'set-view':
      return { ...state, [action.key]: action.value, ...clearedChanges };
    case 'toggle-highlight':
      return { ...state, highlight: !state.highlight };
    case 'set-query':
      return { ...state, query: action.query };
    case 'toggle-area':
      return { ...state, collapsedAreaIds: toggleItem(state.collapsedAreaIds, action.areaId) };
    case 'reset-preview':
      return { ...state, resetCount: state.resetCount + 1, ...clearedChanges };
    case 'measuring':
      // Keep the last diff and selection while measuring again, so using a preview does not reset the reviewer's place.
      return { ...state, isMeasuring: true, measureError: null };
    case 'diff-ready':
      return { ...state, isMeasuring: false, measureError: null, diff: action.diff, selectedChange: findSameChange(state, action.diff) };
    case 'diff-failed':
      return { ...state, isMeasuring: false, diff: null, selectedChange: null, hoveredChange: null, measureError: action.message };
    case 'select-change':
      return { ...state, selectedChange: action.index, hoveredChange: null };
    case 'hover-change':
      return { ...state, hoveredChange: action.index };
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
      return { ...state, categoryFilter: action.category, selectedChange: null };
    case 'set-inspecting':
      return { ...state, isInspecting: action.isInspecting, isInspectorOpen: action.isInspecting ? true : state.isInspectorOpen };
    case 'set-inspector':
      return { ...state, isInspectorOpen: action.isOpen };
    case 'toggle-sidebar':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'set-popover':
      return { ...state, popover: action.popover };
    default:
      return state;
  }
};

export const selectAdjacentStateId = (states, stateId, offset) => getAdjacentState(states, stateId, offset)?.id ?? null;
export { getVisibleChangeIndexes };
