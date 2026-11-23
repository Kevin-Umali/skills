// Small transient panels: fixture details, the marker legend, the Share menu and the copy-link fallback.
// They never push the previews. Opening one closes any other, because there is one `popover` value in the state.
import { getShareActions } from '../core/controls.js';
import { orDash } from '../core/registry.js';
import { byId, createElement } from './dom.js';

const DETAIL_ROWS = [['Description', 'description'], ['ID', 'id'], ['Source owner', 'owner'], ['Boundary', 'boundary'], ['Limits', 'limits']];
const FIDELITY_NOTE = 'Fixture data, no network. Previews render the registry fixtures only.';

export const createPopovers = ({ dispatch, getState, onShareAction }) => {
  const details = { button: byId('rs-details'), panel: byId('rs-details-pop'), key: 'details' };
  const share = { button: byId('rs-share'), panel: byId('rs-share-menu'), key: 'share' };
  const legend = { button: byId('rs-legend-button'), panel: byId('rs-legend-pop'), key: 'legend' };
  const copyFallback = { panel: byId('rs-copy-pop'), key: 'copy-link' };
  const all = [details, share, legend, copyFallback];

  const toggle = (popover) => dispatch({ type: 'set-popover', popover: getState().popover === popover.key ? null : popover.key });
  details.button.addEventListener('click', () => toggle(details));
  share.button.addEventListener('click', () => toggle(share));
  legend.button.addEventListener('click', () => toggle(legend));

  const renderDetails = (current) => {
    const list = createElement('dl');
    DETAIL_ROWS.forEach(([term, field]) => list.append(createElement('dt', { text: term }), createElement('dd', { text: orDash(current[field]) })));
    details.panel.replaceChildren(list, createElement('p', { className: 'rs-pop-note', text: FIDELITY_NOTE }));
  };

  const renderShareMenu = () => {
    const items = getShareActions().map((action) => {
      const item = createElement('button', { className: 'rs-menu-item', text: action.label, attributes: { type: 'button', role: 'menuitem' }, dataset: { value: action.value } });
      item.addEventListener('click', () => onShareAction(action.value));
      return item;
    });
    share.panel.replaceChildren(...items);
    share.panel.addEventListener('keydown', (event) => {
      const offset = { ArrowDown: 1, ArrowUp: -1 }[event.key];
      if (!offset) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement);
      items[(index + offset + items.length) % items.length].focus();
    });
  };

  const renderLegend = () => {
    const row = (markClass, text) => createElement('div', { className: 'rs-legend-row' }, [createElement('span', { className: `rs-mark ${markClass}`, attributes: { 'aria-hidden': 'true' } }), createElement('span', { text })]);
    legend.panel.replaceChildren(row('rs-mark--own', 'Changed in this state'), row('rs-mark--area', 'Area-wide change only'));
  };

  const renderCopyFallback = () => {
    const field = createElement('input', { attributes: { readonly: '', 'aria-label': 'Review link' } });
    field.value = location.href;
    copyFallback.panel.replaceChildren(createElement('p', { text: 'Could not copy automatically. Copy the link from here:' }), field);
    field.select();
  };

  renderShareMenu();
  renderLegend();

  // Called for the toolbar and the sidebar. Only the open panel is rebuilt.
  const render = (state, current) => {
    all.forEach((popover) => {
      const isOpen = state.popover === popover.key;
      popover.panel.hidden = !isOpen;
      popover.button?.setAttribute('aria-expanded', String(isOpen));
    });
    if (state.popover === 'details') renderDetails(current);
    if (state.popover === 'copy-link') renderCopyFallback();
  };

  // Moving focus into the menu lets keyboard users reach it.
  const focusFirstMenuItem = () => share.panel.querySelector('button')?.focus();

  return { render, focusFirstMenuItem, getButton: (key) => all.find((popover) => popover.key === key)?.button };
};
