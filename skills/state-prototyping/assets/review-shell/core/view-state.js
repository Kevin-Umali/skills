// The review URL and the defaults a load computes. Parse and serialise live here so both starters share one contract.
// Defaults are left out of the URL. Compare and sidebar are written only after the reviewer changes them.
import {
  CHANGES_ACTIVE,
  COMPARISON_ENABLED,
  DEFAULT_SPLIT,
  DEFAULT_VIEW,
  INSPECTOR_DOCK_BREAKPOINT_PX,
  INSPECTOR_WIDTH_PX,
  SIDEBAR_OVERLAY_BREAKPOINT_PX,
  SIDEBAR_WIDTH_PX,
  SPLIT_MIN_STAGE_WIDTH_PX,
} from './constants.js';
import { getOptionValues } from './controls.js';
import { clampSplit } from './slider.js';

const COMPARE_ALIASES = { side: 'split' }; // links made before the slider existed

const pickOption = (value, controlId, fallback) => (getOptionValues(controlId).includes(value) ? value : fallback);

const readCompare = (value) => {
  const candidate = COMPARE_ALIASES[value] ?? value;
  return getOptionValues('compare').includes(candidate) ? candidate : null;
};

// Below the breakpoint the sidebar is an overlay and starts closed.
export const getDefaultSidebarOpen = (windowWidth) => windowWidth >= SIDEBAR_OVERLAY_BREAKPOINT_PX;

// What the stage will measure once the docked panels have taken their share of the window.
export const estimateStageWidth = (windowWidth, { isSidebarOpen, isInspectorOpen }) => {
  const sidebarWidth = isSidebarOpen && windowWidth >= SIDEBAR_OVERLAY_BREAKPOINT_PX ? SIDEBAR_WIDTH_PX : 0;
  const inspectorWidth = isInspectorOpen && windowWidth >= INSPECTOR_DOCK_BREAKPOINT_PX ? INSPECTOR_WIDTH_PX : 0;
  return windowWidth - sidebarWidth - inspectorWidth;
};

export const getDefaultCompare = (stageWidth) => (COMPARISON_ENABLED && stageWidth >= SPLIT_MIN_STAGE_WIDTH_PX ? 'split' : 'after');

export const readViewFromSearch = (search, states, windowWidth) => {
  const params = new URLSearchParams(search);
  const requestedStateId = params.get('state');
  const requestedCompare = COMPARISON_ENABLED ? readCompare(params.get('compare')) : null;
  const sidebarChosen = params.has('sidebar');
  const isSidebarOpen = sidebarChosen ? params.get('sidebar') !== '0' : getDefaultSidebarOpen(windowWidth);
  const isInspectorOpen = CHANGES_ACTIVE && params.get('inspector') === '1';
  const requestedChange = Number.parseInt(params.get('change') ?? '', 10);
  return {
    stateId: states.some((state) => state.id === requestedStateId) ? requestedStateId : states[0].id,
    theme: pickOption(params.get('theme'), 'theme', DEFAULT_VIEW.theme),
    width: pickOption(params.get('width'), 'width', DEFAULT_VIEW.width),
    compare: !COMPARISON_ENABLED ? 'after' : requestedCompare ?? getDefaultCompare(estimateStageWidth(windowWidth, { isSidebarOpen, isInspectorOpen })),
    compareChosen: requestedCompare !== null,
    split: params.has('split') ? clampSplit(Number.parseInt(params.get('split'), 10)) : DEFAULT_SPLIT,
    highlight: params.get('highlight') !== '0',
    isSidebarOpen,
    sidebarChosen,
    isInspectorOpen,
    selectedChange: CHANGES_ACTIVE && Number.isInteger(requestedChange) && requestedChange >= 0 ? requestedChange : null,
  };
};

export const buildSearchFromView = (view) => {
  const params = new URLSearchParams({ state: view.stateId });
  if (view.theme !== DEFAULT_VIEW.theme) params.set('theme', view.theme);
  if (view.width !== DEFAULT_VIEW.width) params.set('width', view.width);
  if (view.compareChosen) params.set('compare', view.compare);
  if (view.compare === 'slider' && view.split !== DEFAULT_SPLIT) params.set('split', String(view.split));
  if (CHANGES_ACTIVE && !view.highlight) params.set('highlight', '0');
  if (view.sidebarChosen) params.set('sidebar', view.isSidebarOpen ? '1' : '0');
  if (CHANGES_ACTIVE && view.isInspectorOpen) params.set('inspector', '1');
  if (CHANGES_ACTIVE && view.selectedChange !== null) params.set('change', String(view.selectedChange));
  return params.toString();
};

export const buildFrameUrl = (baseUrl, side, view, resetCount) =>
  `${baseUrl}${side}/frame.html?${new URLSearchParams({
    state: view.stateId,
    theme: view.theme,
    reset: String(resetCount),
  })}`;
