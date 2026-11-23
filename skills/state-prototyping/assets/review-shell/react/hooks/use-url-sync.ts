import { useEffect } from 'react';
import { createThrottledCall } from '../../core/scheduling.js';
import { buildSearchFromView } from '../../core/view-state.js';
import type { ReviewStore } from '../review-store';

// A drag of the slider would otherwise call history.replaceState on every pointer move.
const URL_WRITE_INTERVAL_MS = 100;

// The URL follows the view. It is written only when it actually changed, at most ten times a second.
export const useUrlSync = (store: ReviewStore) => {
  useEffect(() => {
    let lastSearch = location.search.slice(1);
    const scheduleUrlWrite = createThrottledCall(() => {
      const search = buildSearchFromView(store.getState());
      lastSearch = search;
      history.replaceState(null, '', `${location.pathname}?${search}`);
    }, URL_WRITE_INTERVAL_MS);
    return store.onAction((state) => {
      if (buildSearchFromView(state) !== lastSearch) scheduleUrlWrite();
    });
  }, [store]);
};
