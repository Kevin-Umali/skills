// The review URL: which state, theme, width, comparison mode and highlight setting are shown.
import { COMPARE_OPTIONS, DEFAULT_VIEW, THEME_OPTIONS, WIDTH_OPTIONS } from './constants.js';

const pickOption = (value, options, fallback) => (options.some(([key]) => key === value) ? value : fallback);

export const readViewFromSearch = (search, states, defaultSidebarOpen = DEFAULT_VIEW.isSidebarOpen) => {
  const params = new URLSearchParams(search);
  const requestedStateId = params.get('state');
  return {
    stateId: states.some((state) => state.id === requestedStateId) ? requestedStateId : states[0].id,
    theme: pickOption(params.get('theme'), THEME_OPTIONS, DEFAULT_VIEW.theme),
    width: pickOption(params.get('width'), WIDTH_OPTIONS, DEFAULT_VIEW.width),
    compare: pickOption(params.get('compare'), COMPARE_OPTIONS, DEFAULT_VIEW.compare),
    highlight: params.get('highlight') !== '0',
    isSidebarOpen: params.has('sidebar') ? params.get('sidebar') !== '0' : defaultSidebarOpen,
  };
};

export const buildSearchFromView = (view) =>
  new URLSearchParams({
    state: view.stateId,
    theme: view.theme,
    width: view.width,
    compare: view.compare,
    highlight: view.highlight ? '1' : '0',
    sidebar: view.isSidebarOpen ? '1' : '0',
  }).toString();

export const buildFrameUrl = (baseUrl, side, view, resetCount) =>
  `${baseUrl}${side}/frame.html?${new URLSearchParams({
    state: view.stateId,
    theme: view.theme,
    reset: String(resetCount),
  })}`;
