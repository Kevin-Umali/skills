// Compact top bar: sidebar toggle, Compare, Width, Theme, Highlight, and the Changes toggle. It never scrolls.
import { COMPARE_OPTIONS, THEME_OPTIONS, WIDTH_OPTIONS } from '../core/constants.js';
import { byId, createButton } from './dom.js';

const SEGMENTED_GROUPS = [
  { containerId: 'rs-compare', options: COMPARE_OPTIONS, key: 'compare' },
  { containerId: 'rs-width', options: WIDTH_OPTIONS, key: 'width' },
  { containerId: 'rs-theme', options: THEME_OPTIONS, key: 'theme' },
];

export const createTopBar = ({ dispatch, getState }) => {
  const root = byId('rs-root');
  const sidebarButton = byId('rs-toggle-sidebar');
  const highlightButton = byId('rs-highlight');
  const inspectorButton = byId('rs-toggle-inspector');
  const changesCount = byId('rs-changes-count');

  const segmentedGroups = SEGMENTED_GROUPS.map(({ containerId, options, key }) => {
    const buttons = options.map(([value, label]) => {
      const button = createButton(label);
      button.addEventListener('click', () => dispatch({ type: 'set-view', key, value }));
      return { value, button };
    });
    byId(containerId).replaceChildren(...buttons.map(({ button }) => button));
    return { key, buttons };
  });

  sidebarButton.addEventListener('click', () => dispatch({ type: 'toggle-sidebar' }));
  highlightButton.addEventListener('click', () => dispatch({ type: 'toggle-highlight' }));
  inspectorButton.addEventListener('click', () => dispatch({ type: 'set-inspector', isOpen: !getState().isInspectorOpen }));

  const render = (state) => {
    root.dataset.sidebar = state.isSidebarOpen ? 'open' : 'closed';
    sidebarButton.setAttribute('aria-pressed', String(state.isSidebarOpen));
    segmentedGroups.forEach(({ key, buttons }) => {
      buttons.forEach(({ value, button }) => button.setAttribute('aria-pressed', String(state[key] === value)));
    });
    highlightButton.setAttribute('aria-pressed', String(state.highlight));
    inspectorButton.setAttribute('aria-pressed', String(state.isInspectorOpen));
    changesCount.textContent = state.diff?.entries.length ? String(state.diff.entries.length) : '';
  };

  // The top bar sticks to the window top on narrow windows, so its height is kept in a CSS variable.
  const topBar = byId('rs-top');
  const syncHeight = () => root.style.setProperty('--rs-top-height', `${topBar.offsetHeight}px`);
  window.addEventListener('resize', syncHeight);
  new ResizeObserver(syncHeight).observe(topBar);

  return { render, syncHeight };
};
