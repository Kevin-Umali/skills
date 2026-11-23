// Publishes the current view, the selected change and the measured diff as JSON in the page,
// so an agent can read what the reviewer sees without vision.
import { buildChangeSummary, buildReviewData } from '../core/export-changes.js';
import { findState } from '../core/registry.js';
import { byId, createChangeDetector } from './dom.js';

export const createReviewData = ({ states }) => {
  const script = byId('rs-review-data');
  const hasChanged = createChangeDetector();
  let summary = null;
  let summarizedDiff = null;
  let summarizedStateId = null;

  const render = (state) => {
    if (!hasChanged(state.stateId, state.compare, state.width, state.theme, state.split, state.selectedChange, state.diff)) return;
    const current = findState(states, state.stateId);
    if (state.diff !== summarizedDiff || state.stateId !== summarizedStateId) {
      summary = state.diff ? buildChangeSummary(current, state.diff) : null;
      summarizedDiff = state.diff;
      summarizedStateId = state.stateId;
    }
    script.textContent = JSON.stringify(buildReviewData(state, current, summary));
  };

  return { render };
};
