// The shell state lives in core's reducer. This store runs it and keeps one snapshot per part of the shell, so an action
// only re-renders the parts core/render-scopes.js says it can change (hovering a change does not touch the toolbar or the sidebar).
import { useSyncExternalStore } from 'react';
import { RENDER_PARTS, getRenderParts } from '../core/render-scopes.js';
import { createInitialState, reviewReducer } from '../core/review-reducer.js';
import type { RenderPart, ReviewAction, ReviewState } from './types';

type ActionListener = (state: ReviewState, action: ReviewAction) => void;

export const createReviewStore = (initialView: unknown) => {
  let state = createInitialState(initialView) as ReviewState;
  let liveText = '';
  const snapshots = Object.fromEntries((RENDER_PARTS as RenderPart[]).map((part) => [part, state])) as Record<RenderPart, ReviewState>;
  const changeListeners = new Set<() => void>();
  const actionListeners = new Set<ActionListener>();
  const layoutListeners = new Set<() => void>();

  const getState = () => state;
  const dispatch = (action: ReviewAction) => {
    state = reviewReducer(state, action) as ReviewState;
    (getRenderParts(action.type) as RenderPart[]).forEach((part) => { snapshots[part] = state; });
    actionListeners.forEach((listener) => listener(state, action));
    changeListeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    changeListeners.add(listener);
    return () => { changeListeners.delete(listener); };
  };
  const onAction = (listener: ActionListener) => {
    actionListeners.add(listener);
    return () => { actionListeners.delete(listener); };
  };

  // A preview scrolled or resized, so outlines drawn from element positions must be redrawn.
  const onLayoutChange = (listener: () => void) => {
    layoutListeners.add(listener);
    return () => { layoutListeners.delete(listener); };
  };
  const notifyLayoutChange = () => layoutListeners.forEach((listener) => listener());

  // The #rs-live status text. Set by the announcer, the Changes inspector and the Share menu.
  const announce = (text: string) => {
    liveText = text;
    changeListeners.forEach((listener) => listener());
  };

  return { getState, dispatch, subscribe, onAction, onLayoutChange, notifyLayoutChange, announce, getPart: (part: RenderPart) => snapshots[part], getLiveText: () => liveText };
};

export type ReviewStore = ReturnType<typeof createReviewStore>;

export const usePartOfStore = (store: ReviewStore, part: RenderPart) => useSyncExternalStore(store.subscribe, () => store.getPart(part));
export const useLiveText = (store: ReviewStore) => useSyncExternalStore(store.subscribe, store.getLiveText);
