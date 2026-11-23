// Says what the reviewer is looking at whenever the state or the view changes. Silent on first load.
// The Changes inspector and the Share menu use the same status region through `store.announce`.
import { useEffect, useRef } from 'react';
import { describeView } from '../../core/controls.js';
import { findState, getAreaLabel } from '../../core/registry.js';
import { useReview, useReviewPart } from '../review-context';
import { useLiveText } from '../review-store';

export const LiveRegion = () => {
  const { areas, states, store } = useReview();
  const state = useReviewPart('announcer');
  const text = useLiveText(store);
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${state.stateId}|${state.compare}|${state.width}`;
    if (previousKey.current === key) return;
    const isFirstRender = previousKey.current === null;
    previousKey.current = key;
    if (isFirstRender) return;
    const current = findState(states, state.stateId);
    store.announce(describeView(getAreaLabel(areas, current.area), current.label, state));
  }, [state.stateId, state.compare, state.width]);

  return <div className="rs-sr" id="rs-live" role="status">{text}</div>;
};
