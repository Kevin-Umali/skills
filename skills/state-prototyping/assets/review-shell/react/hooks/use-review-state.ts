import { useEffect, useReducer } from 'react';
import { NARROW_WINDOW_QUERY } from '../../core/constants.js';
import { createInitialState, reviewReducer } from '../../core/review-reducer.js';
import { buildSearchFromView, readViewFromSearch } from '../../core/view-state.js';
import type { PrototypeState, ReviewAction, ReviewState } from '../types';

// The shell state lives in the shared reducer, so it behaves exactly like the vanilla starter.
export const useReviewState = (states: PrototypeState[]) => {
  const [state, dispatch] = useReducer(
    reviewReducer as (state: ReviewState, action: ReviewAction) => ReviewState,
    states,
    (registry: PrototypeState[]) => createInitialState(readViewFromSearch(location.search, registry, !matchMedia(NARROW_WINDOW_QUERY).matches)) as ReviewState,
  );

  useEffect(() => {
    history.replaceState(null, '', `${location.pathname}?${buildSearchFromView(state)}`);
  }, [state.stateId, state.theme, state.width, state.compare, state.highlight, state.isSidebarOpen]);

  return [state, dispatch] as const;
};
