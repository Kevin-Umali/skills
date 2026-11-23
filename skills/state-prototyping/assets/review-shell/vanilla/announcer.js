// Says what the reviewer is looking at whenever the state or the view changes. Silent on first load.
import { describeView } from '../core/controls.js';
import { findState, getAreaLabel } from '../core/registry.js';
import { byId, createChangeDetector } from './dom.js';

export const createAnnouncer = ({ areas, states }) => {
  const liveRegion = byId('rs-live');
  const hasChanged = createChangeDetector();
  let isFirstRender = true;

  const render = (state) => {
    if (!hasChanged(state.stateId, state.compare, state.width)) return;
    if (isFirstRender) {
      isFirstRender = false;
      return;
    }
    const current = findState(states, state.stateId);
    liveRegion.textContent = describeView(getAreaLabel(areas, current.area), current.label, state);
  };

  return { render };
};
