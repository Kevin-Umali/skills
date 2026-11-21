// Publishes the measured diff as JSON in the page, so an agent can read the changes without vision.
import { buildChangeSummary } from '../core/export-changes.js';
import { findState } from '../core/registry.js';
import { byId } from './dom.js';

export const createReviewData = ({ states }) => {
  const script = byId('rs-review-data');
  let lastDiff = null;

  const render = (state) => {
    if (state.diff === lastDiff) return;
    lastDiff = state.diff;
    const current = findState(states, state.stateId);
    const data = state.diff ? buildChangeSummary(current, state.diff) : { stateId: current.id, measured: false };
    script.textContent = JSON.stringify(data);
  };

  return { render };
};
