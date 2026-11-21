// Entry point: builds the store, creates each part of the shell, and redraws them on every change.
import { CHANGE_TRACKING_ENABLED, FRAME_SIDES, NARROW_WINDOW_QUERY } from '../core/constants.js';
import { createInitialState, reviewReducer } from '../core/review-reducer.js';
import { buildSearchFromView, readViewFromSearch } from '../core/view-state.js';
import { areas, states } from '../states.js';
import { notes, reasons } from '../notes.js';
import { createHighlights } from './highlights.js';
import { createInspector } from './inspector.js';
import { createNavigator } from './navigator.js';
import { createPreviewFrames } from './preview-frames.js';
import { createReviewData } from './review-data.js';
import { createSidebar } from './sidebar.js';
import { createStore } from './store.js';
import { createTopBar } from './top-bar.js';

// These actions change what the previews render, so the diff is measured again.
const MEASURE_TRIGGER_ACTIONS = new Set(['select-state', 'set-view', 'reset-preview']);

const isNarrowWindow = matchMedia(NARROW_WINDOW_QUERY).matches;
const store = createStore(reviewReducer, createInitialState(readViewFromSearch(location.search, states, !isNarrowWindow)));
const { dispatch, getState, subscribe } = store;

const highlights = createHighlights({ dispatch, getState });
const previewFrames = createPreviewFrames({
  dispatch,
  getState,
  getReasons: () => reasons,
  onLayoutChange: () => highlights.render(getState()),
});
const topBar = createTopBar({ dispatch, getState });
const parts = [
  createSidebar({ areas, states, notes, dispatch }),
  topBar,
  createNavigator({ areas, states, dispatch, getState }),
  previewFrames,
  highlights,
  createInspector({ states, notes, dispatch }),
  createReviewData({ states }),
];

const syncUrl = (state) => history.replaceState(null, '', `${location.pathname}?${buildSearchFromView(state)}`);

subscribe((state, action) => {
  parts.forEach((part) => part.render(state));
  syncUrl(state);
  if (MEASURE_TRIGGER_ACTIONS.has(action.type)) previewFrames.scheduleDiff();
});

// A preview may ask the shell to change state. Check origin, sender, type and registry id before acting.
window.addEventListener('message', (event) => {
  const knownSenders = FRAME_SIDES.map((side) => previewFrames.getIframe(side).contentWindow);
  const message = event.data;
  const isTrusted = event.origin === location.origin && knownSenders.includes(event.source);
  const target = isTrusted && message?.type === 'prototype:select-state' ? states.find((state) => state.id === message.id) : null;
  if (target) dispatch({ type: 'select-state', stateId: target.id, areaId: target.area });
});

document.getElementById('rs-root').dataset.changes = CHANGE_TRACKING_ENABLED ? 'on' : 'off';
parts.forEach((part) => part.render(getState()));
topBar.syncHeight();
previewFrames.scheduleDiff();
