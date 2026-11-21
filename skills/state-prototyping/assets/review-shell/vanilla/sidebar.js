// Left sidebar: searchable state list grouped by area, markers, legend and Reset state.
import { getChangeKind, getChangeLines, isAreaLocked, matchesQuery } from '../core/registry.js';
import { byId, createButton, createElement, renderKeepingFocus } from './dom.js';

const CHEVRON_SVG = '<svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOCK_SVG = '<svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden="true"><rect x="2" y="5.25" width="8" height="5" rx="1.25" stroke="currentColor" stroke-width="1.25"/><path d="M4 5V3.75a2 2 0 014 0V5" stroke="currentColor" stroke-width="1.25"/></svg>';

export const createSidebar = ({ areas, states, notes, dispatch }) => {
  const listElement = byId('rs-list');
  const countElement = byId('rs-count');
  const searchInput = byId('rs-query');
  let previousKey = '';

  const createStateButton = (state, currentStateId) => {
    const button = createButton(state.label, {
      className: 'rs-state',
      dataset: { id: state.id, focusKey: `state:${state.id}` },
    });
    const changeKind = getChangeKind(state, notes);
    if (changeKind === 'own' || changeKind === 'area') {
      button.append(createElement('span', { className: `rs-mark rs-mark--${changeKind}` }));
      button.append(createElement('span', {
        className: 'rs-sr',
        text: changeKind === 'own' ? ', changed in After' : ', area-wide change in After',
      }));
      button.title = getChangeLines(state, notes).map((line) => `• ${line}`).join('\n');
    }
    if (state.id === currentStateId) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => dispatch({ type: 'select-state', stateId: state.id, areaId: state.area }));
    return button;
  };

  const createAreaGroup = (area, visibleStates, state, isSearching) => {
    const isOpen = isSearching || !state.collapsedAreaIds.includes(area.id); // matches inside collapsed groups stay visible while searching
    const header = createButton('', {
      className: 'rs-area-btn',
      dataset: { focusKey: `area:${area.id}` },
      attributes: { 'aria-expanded': String(isOpen), 'aria-controls': `rs-group-${area.id}` },
    });
    header.innerHTML = CHEVRON_SVG;
    header.append(createElement('span', { text: area.label }));
    if (isAreaLocked(notes, area.id)) {
      const lockChip = createElement('span', { className: 'rs-lock', text: 'Locked' });
      lockChip.insertAdjacentHTML('afterbegin', LOCK_SVG);
      header.append(lockChip);
    }
    header.append(createElement('span', { className: 'rs-count', text: String(visibleStates.length) }));
    header.addEventListener('click', () => dispatch({ type: 'toggle-area', areaId: area.id }));
    const body = createElement('div', { attributes: { id: `rs-group-${area.id}` } }, visibleStates.map((item) => createStateButton(item, state.stateId)));
    body.hidden = !isOpen;
    return createElement('div', {}, [header, body]);
  };

  const createEmptyResult = (query) => {
    const clearButton = createButton('Clear search');
    clearButton.addEventListener('click', () => { searchInput.value = ''; dispatch({ type: 'set-query', query: '' }); });
    return createElement('p', { className: 'rs-empty', text: `No states match “${query.trim()}”. ` }, [clearButton]);
  };

  const renderList = (state) => {
    const isSearching = Boolean(state.query.trim());
    const groups = areas
      .map((area) => ({ area, visibleStates: states.filter((item) => item.area === area.id && matchesQuery(item, areas, state.query)) }))
      .filter(({ visibleStates }) => visibleStates.length);
    const shownCount = groups.reduce((total, group) => total + group.visibleStates.length, 0);
    listElement.replaceChildren(...(groups.length
      ? groups.map(({ area, visibleStates }) => createAreaGroup(area, visibleStates, state, isSearching))
      : [createEmptyResult(state.query)]));
    countElement.textContent = isSearching ? `${shownCount} of ${states.length} states` : `${states.length} states`;
  };

  const render = (state) => {
    const key = [state.query, state.collapsedAreaIds.join(','), state.stateId].join('|');
    if (key === previousKey) return;
    previousKey = key;
    renderKeepingFocus(listElement, () => renderList(state));
    // Keep the selected row in view without moving keyboard focus.
    listElement.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  };

  searchInput.addEventListener('input', (event) => dispatch({ type: 'set-query', query: event.target.value }));
  byId('rs-reset').addEventListener('click', () => dispatch({ type: 'reset-preview' }));

  return { render };
};
