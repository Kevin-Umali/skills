// The one-row toolbar: sidebar toggle, breadcrumb with Previous and Next, Compare and Width, preview theme,
// the Changes toggle and the Share menu. It also owns the popovers that hang off it and the copy actions.
import { CHANGES_ACTIVE, COPY_NOTICE_MS } from '../core/constants.js';
import { CONTROLS, getNextTheme, getOptionLabel } from '../core/controls.js';
import { buildChangeSummary, formatChangesAsJson, formatChangesAsMarkdown } from '../core/export-changes.js';
import { findState, getAdjacentState, getAreaLabel } from '../core/registry.js';
import { createChoiceControl } from './choice-control.js';
import { byId, createChangeDetector, setIcon } from './dom.js';
import { createPopovers } from './popovers.js';

const SHARE_RESULTS = { done: 'Copied', failed: 'Copy failed' };

export const createToolbar = ({ areas, states, dispatch, getState }) => {
  const root = byId('rs-root');
  const sidebarButton = byId('rs-toggle-sidebar');
  const themeButton = byId('rs-theme');
  const changesButton = byId('rs-changes');
  const shareButton = byId('rs-share');
  const shareLabel = byId('rs-share-label');
  const hasChanged = createChangeDetector();
  let shareTimerId;

  const viewControls = byId('rs-view-controls');
  const compareControl = createChoiceControl({ definition: CONTROLS.compare, mount: viewControls, dispatch, extraClassName: 'rs-compare' });
  const widthControl = createChoiceControl({ definition: CONTROLS.width, mount: viewControls, dispatch, extraClassName: 'rs-width' });

  const selectAdjacent = (offset) => {
    const target = getAdjacentState(states, getState().stateId, offset);
    if (target) dispatch({ type: 'select-state', stateId: target.id, areaId: target.area });
  };

  // Copy results show on the Share button itself: its icon-and-label say "Copied" for a moment. No toast over the previews.
  const showShareResult = (result) => {
    const label = SHARE_RESULTS[result];
    shareLabel.textContent = label;
    shareButton.setAttribute('aria-label', label);
    byId('rs-live').textContent = label;
    clearTimeout(shareTimerId);
    shareTimerId = setTimeout(() => {
      shareLabel.textContent = 'Share';
      shareButton.setAttribute('aria-label', 'Share');
    }, COPY_NOTICE_MS);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch({ type: 'set-popover', popover: null });
      shareButton.focus();
      showShareResult('done');
    } catch {
      return false;
    }
    return true;
  };

  const handleShareAction = async (action) => {
    const state = getState();
    if (action === 'copy-link') {
      if (!(await copyText(location.href))) dispatch({ type: 'set-popover', popover: 'copy-link' });
      return;
    }
    const summary = state.diff ? buildChangeSummary(findState(states, state.stateId), state.diff) : null;
    if (!summary) {
      dispatch({ type: 'set-popover', popover: null });
      showShareResult('failed');
      return;
    }
    const text = action === 'copy-json' ? formatChangesAsJson(summary) : formatChangesAsMarkdown(summary);
    if (!(await copyText(text))) showShareResult('failed');
  };

  const popovers = createPopovers({ dispatch, getState, onShareAction: handleShareAction });

  sidebarButton.addEventListener('click', () => dispatch({ type: 'set-sidebar', isOpen: !getState().isSidebarOpen, isUserChoice: true }));
  byId('rs-previous').addEventListener('click', () => selectAdjacent(-1));
  byId('rs-next').addEventListener('click', () => selectAdjacent(1));
  themeButton.addEventListener('click', () => dispatch({ type: 'set-view', key: 'theme', value: getNextTheme(getState().theme) }));
  changesButton.addEventListener('click', () => dispatch({ type: 'set-inspector', isOpen: !getState().isInspectorOpen }));

  const render = (state) => {
    const current = findState(states, state.stateId);
    const areaLabel = getAreaLabel(areas, current.area);
    root.dataset.sidebar = state.isSidebarOpen ? 'open' : 'closed';
    root.dataset.inspector = CHANGES_ACTIVE && state.isInspectorOpen ? 'open' : 'closed';
    sidebarButton.setAttribute('aria-expanded', String(state.isSidebarOpen));
    sidebarButton.setAttribute('aria-label', state.isSidebarOpen ? 'Hide sidebar' : 'Show sidebar');
    sidebarButton.title = sidebarButton.getAttribute('aria-label');

    byId('rs-crumb-area').textContent = areaLabel;
    byId('rs-crumb-state').textContent = current.label;
    byId('rs-details').setAttribute('aria-label', `Fixture details for ${areaLabel}: ${current.label}`);
    byId('rs-details').title = current.description;
    byId('rs-position').textContent = `${states.indexOf(current) + 1} of ${states.length}`;
    byId('rs-previous').disabled = !getAdjacentState(states, current.id, -1);
    byId('rs-next').disabled = !getAdjacentState(states, current.id, 1);

    compareControl.render(state.compare);
    widthControl.render(state.width);
    const themeLabel = `Preview theme: ${getOptionLabel('theme', state.theme).toLowerCase()}`;
    themeButton.setAttribute('aria-label', themeLabel);
    themeButton.title = 'Preview theme. Click to switch.';
    if (hasChanged(state.theme)) setIcon(themeButton, state.theme === 'dark' ? 'moon' : 'sun');

    changesButton.setAttribute('aria-pressed', String(state.isInspectorOpen));
    const count = state.diff?.entries.length ?? 0;
    byId('rs-changes-count').textContent = count ? String(count) : '';
    changesButton.setAttribute('aria-label', count ? `Changes, ${count}` : 'Changes');

    popovers.render(state, current);
  };

  return { render, popovers };
};
