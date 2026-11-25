// Entry point: builds the store, creates each part of the shell, and redraws only the parts an action can change.
import { CHANGES_ACTIVE, COMPARISON_ENABLED, FRAME_SIDES } from '../core/constants.js';
import { MEASURE_TRIGGER_ACTIONS, getRenderParts } from '../core/render-scopes.js';
import { createInitialState, reviewReducer } from '../core/review-reducer.js';
import { createFrameScheduler, createThrottledCall } from '../core/scheduling.js';
import { buildSearchFromView, readViewFromSearch } from '../core/view-state.js';
import { orderStatesByArea } from '../core/registry.js';
import { areas, states as registryStates } from '../states.js';
import { notes, reasons } from '../notes.js';
import { createAnnouncer } from './announcer.js';
import { hydrateIcons } from './dom.js';
import { createHighlights } from './highlights.js';
import { createInspector } from './inspector.js';
import { createKeyboard } from './keyboard.js';
import { createPreviewFrames } from './preview-frames.js';
import { createReviewData } from './review-data.js';
import { createSidebar } from './sidebar.js';
import { createStore } from './store.js';
import { createToolbar } from './toolbar.js';

const states = orderStatesByArea(areas, registryStates);

// An empty registry has nothing to review. Say so instead of failing with a stack trace.
if (!states.length) {
  document.body.textContent = 'states.js has no states yet. Add the first one, then reload.';
  throw new Error('states.js has no states.');
}

const root = document.getElementById('rs-root');
root.dataset.changes = CHANGES_ACTIVE ? 'on' : 'off';
root.dataset.comparison = COMPARISON_ENABLED ? 'on' : 'off';
hydrateIcons();

const store = createStore(reviewReducer, createInitialState(readViewFromSearch(location.search, states, window.innerWidth)));
const { dispatch, getState, subscribe } = store;

const highlights = createHighlights({ dispatch, getState });
const redrawScheduler = createFrameScheduler(() => highlights.render());
const previewFrames = createPreviewFrames({ dispatch, getState, getReasons: () => reasons, onLayoutChange: redrawScheduler.schedule });
const toolbar = createToolbar({ areas, states, dispatch, getState });
createKeyboard({ dispatch, getState, popovers: toolbar.popovers });

const parts = {
  toolbar,
  sidebar: createSidebar({ areas, states, notes, dispatch }),
  stage: previewFrames,
  highlights,
  inspector: createInspector({ states, notes, dispatch }),
  data: createReviewData({ states }),
  announcer: createAnnouncer({ areas, states }),
};

// The URL follows the view. It is written only when it actually changed, at most ten times a second
// (a drag of the slider would otherwise call history.replaceState on every pointer move).
const URL_WRITE_INTERVAL_MS = 100;
let lastSearch = location.search.slice(1);
const scheduleUrlWrite = createThrottledCall(() => {
  const search = buildSearchFromView(getState());
  lastSearch = search;
  history.replaceState(null, '', `${location.pathname}?${search}`);
}, URL_WRITE_INTERVAL_MS);

subscribe((state, action) => {
  getRenderParts(action.type).forEach((name) => parts[name].render(state));
  if (buildSearchFromView(state) !== lastSearch) scheduleUrlWrite();
  if (action.type === 'set-popover' && state.popover === 'share') toolbar.popovers.focusFirstMenuItem();
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

Object.values(parts).forEach((part) => part.render(getState()));
previewFrames.scheduleDiff();
// Transitions are scoped to [data-ready], so nothing animates on the first paint.
requestAnimationFrame(() => { root.dataset.ready = ''; });
