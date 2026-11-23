// Left sidebar: a searchable listbox of states grouped by area, a count, Reset state and the marker legend.
// The list is one tab stop. Arrow keys, Home and End move focus; Enter or Space picks the focused state.
import { CHANGES_ACTIVE, SIDEBAR_OVERLAY_QUERY } from '../core/constants.js';
import { getChangeKind, getChangeLines, isAreaLocked, matchesQuery } from '../core/registry.js';
import { buildIconSvg } from '../core/icons.js';
import { byId, createButton, createChangeDetector, createElement } from './dom.js';

export const createSidebar = ({ areas, states, notes, dispatch }) => {
  const listElement = byId('rs-list');
  const countElement = byId('rs-count');
  const searchInput = byId('rs-query');
  const hasQueryChanged = createChangeDetector();
  const hasSelectionChanged = createChangeDetector();
  let options = [];

  const selectState = (state) => dispatch({
    type: 'select-state',
    stateId: state.id,
    areaId: state.area,
    closesSidebar: matchMedia(SIDEBAR_OVERLAY_QUERY).matches,
  });

  const createOption = (state) => {
    const option = createElement('div', {
      attributes: { role: 'option', tabindex: '-1', 'aria-selected': 'false' },
      className: 'rs-state',
      dataset: { stateId: state.id },
    }, [createElement('span', { text: state.label })]);
    const changeKind = CHANGES_ACTIVE ? getChangeKind(state, notes) : 'none';
    if (changeKind === 'own' || changeKind === 'area') {
      option.append(
        createElement('span', { className: `rs-mark rs-mark--${changeKind}`, attributes: { 'aria-hidden': 'true' } }),
        createElement('span', { className: 'rs-sr', text: changeKind === 'own' ? ', changed in After' : ', area-wide change in After' }),
      );
      option.title = getChangeLines(state, notes).map((line) => `• ${line}`).join('\n');
    }
    option.addEventListener('click', () => selectState(state));
    return option;
  };

  const createLockChip = () => {
    const chip = createElement('span', { className: 'rs-lock', text: 'Locked' });
    chip.insertAdjacentHTML('afterbegin', buildIconSvg('lock'));
    return chip;
  };

  const createAreaGroup = (area, visibleStates) => {
    const heading = createElement('div', { className: 'rs-area', attributes: { 'aria-hidden': 'true' }, text: area.label });
    if (isAreaLocked(notes, area.id)) heading.append(' ', createLockChip());
    return createElement('div', { attributes: { role: 'group', 'aria-label': area.label } }, [heading, ...visibleStates.map(createOption)]);
  };

  const createEmptyResult = (query) => {
    const clearButton = createButton('Clear search');
    clearButton.addEventListener('click', () => { searchInput.value = ''; dispatch({ type: 'set-query', query: '' }); });
    return createElement('p', { className: 'rs-empty', text: `No states match “${query.trim()}”. ` }, [clearButton]);
  };

  const renderList = (query) => {
    const groups = areas
      .map((area) => ({ area, visibleStates: states.filter((item) => item.area === area.id && matchesQuery(item, areas, query)) }))
      .filter(({ visibleStates }) => visibleStates.length);
    const shownCount = groups.reduce((total, group) => total + group.visibleStates.length, 0);
    listElement.replaceChildren(...(groups.length ? groups.map(({ area, visibleStates }) => createAreaGroup(area, visibleStates)) : [createEmptyResult(query)]));
    options = [...listElement.querySelectorAll('[role="option"]')];
    countElement.textContent = query.trim() ? `${shownCount} of ${states.length} states` : `${states.length} states`;
  };

  // Marks the current state and makes it (or the first row) the list's single tab stop.
  const syncSelection = (stateId) => {
    options.forEach((option) => option.setAttribute('aria-selected', String(option.dataset.stateId === stateId)));
    const tabStop = options.find((option) => option.dataset.stateId === stateId) ?? options[0];
    options.forEach((option) => { option.tabIndex = option === tabStop ? 0 : -1; });
    listElement.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };

  const moveFocus = (option) => {
    options.forEach((candidate) => { candidate.tabIndex = candidate === option ? 0 : -1; });
    option.focus();
  };

  listElement.addEventListener('keydown', (event) => {
    const index = options.indexOf(document.activeElement);
    if (index === -1) return;
    const targetIndex = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 }[event.key];
    if (targetIndex !== undefined) {
      event.preventDefault();
      moveFocus(options[Math.min(Math.max(targetIndex, 0), options.length - 1)]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      options[index].click();
    }
  });

  searchInput.addEventListener('input', (event) => dispatch({ type: 'set-query', query: event.target.value }));
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && options.length) {
      event.preventDefault();
      moveFocus(options.find((option) => option.tabIndex === 0) ?? options[0]);
    }
  });
  byId('rs-reset').addEventListener('click', () => dispatch({ type: 'reset-preview' }));
  byId('rs-scrim').addEventListener('click', () => dispatch({ type: 'set-sidebar', isOpen: false, isUserChoice: false }));

  const render = (state) => {
    if (hasQueryChanged(state.query)) {
      renderList(state.query);
      hasSelectionChanged(null); // the rows are new, so the selection must be applied again
    }
    if (hasSelectionChanged(state.stateId)) syncSelection(state.stateId);
  };

  return { render, focusSearch: () => searchInput.focus() };
};
