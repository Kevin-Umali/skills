// Floating navigator at the bottom centre: Previous, the selected state (opens its fixture details), Next.
// It also owns Copy link, whose button lives in the top bar.
import { COPY_NOTICE_MS } from '../core/constants.js';
import { findState, getAdjacentState, getAreaLabel } from '../core/registry.js';
import { byId, createElement } from './dom.js';

const POPOVER_TITLES = { details: 'Fixture details', 'copy-link': 'Copy link' };

export const createNavigator = ({ areas, states, dispatch, getState }) => {
  const popover = byId('rs-popover');
  const detailsButton = byId('rs-details');
  const noticeElement = byId('rs-link-notice');
  let noticeTimerId;

  const renderDetails = (state) => {
    const definitionList = createElement('dl');
    [['Description', state.description], ['ID', state.id], ['Source owner', state.owner], ['Boundary', state.boundary], ['Limits', state.limits]].forEach(([term, description]) => {
      definitionList.append(createElement('dt', { text: term }), createElement('dd', { text: description }));
    });
    popover.replaceChildren(definitionList);
  };

  const renderCopyFallback = () => {
    const field = createElement('input', { attributes: { readonly: '', 'aria-label': 'Review link' } });
    field.value = location.href;
    popover.replaceChildren(createElement('p', { text: 'Could not copy automatically. Copy the link from here:' }), field);
    field.select();
  };

  const showNotice = (message) => {
    noticeElement.textContent = message;
    clearTimeout(noticeTimerId);
    noticeTimerId = setTimeout(() => { noticeElement.textContent = ''; }, COPY_NOTICE_MS);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      dispatch({ type: 'set-popover', popover: null });
      showNotice('Link copied.');
    } catch {
      dispatch({ type: 'set-popover', popover: 'copy-link' });
    }
  };

  const render = (state) => {
    const current = findState(states, state.stateId);
    const label = `${getAreaLabel(areas, current.area)}: ${current.label}`;
    byId('rs-title').textContent = label;
    byId('rs-position').textContent = `${states.indexOf(current) + 1} of ${states.length}`;
    detailsButton.title = current.description;
    detailsButton.setAttribute('aria-label', `Fixture details for ${label}`);
    byId('rs-previous').disabled = !getAdjacentState(states, current.id, -1);
    byId('rs-next').disabled = !getAdjacentState(states, current.id, 1);
    detailsButton.setAttribute('aria-expanded', String(state.popover === 'details'));
    popover.hidden = !state.popover;
    if (!state.popover) return;
    popover.setAttribute('aria-label', POPOVER_TITLES[state.popover]);
    if (state.popover === 'details') renderDetails(current);
    else renderCopyFallback();
  };

  const selectAdjacent = (offset) => {
    const target = getAdjacentState(states, getState().stateId, offset);
    if (target) dispatch({ type: 'select-state', stateId: target.id, areaId: target.area });
  };

  byId('rs-previous').addEventListener('click', () => selectAdjacent(-1));
  byId('rs-next').addEventListener('click', () => selectAdjacent(1));
  detailsButton.addEventListener('click', () => dispatch({ type: 'set-popover', popover: getState().popover === 'details' ? null : 'details' }));
  byId('rs-copy-link').addEventListener('click', copyLink);

  // The popover is not modal: Escape, an outside click, or focus moving into a preview closes it.
  const closePopover = ({ restoreFocus = false } = {}) => {
    if (!getState().popover) return;
    dispatch({ type: 'set-popover', popover: null });
    if (restoreFocus) detailsButton.focus();
  };
  document.addEventListener('pointerdown', (event) => {
    if (!popover.contains(event.target) && !event.target.closest('#rs-details, #rs-copy-link')) closePopover();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePopover({ restoreFocus: true });
  });
  window.addEventListener('blur', () => closePopover());

  return { render };
};
