// Publishes the current view, the selected change and the measured diff as JSON in the page,
// so an agent can read what the reviewer sees without vision.
import { useMemo } from 'react';
import { buildChangeSummary, buildReviewData } from '../../core/export-changes.js';
import { findState } from '../../core/registry.js';
import { useReview, useReviewPart } from '../review-context';

export const ReviewData = () => {
  const { states } = useReview();
  const state = useReviewPart('data');
  const current = findState(states, state.stateId);
  const summary = useMemo(() => (state.diff ? buildChangeSummary(current, state.diff) : null), [current, state.diff]);
  // `<` is escaped so the JSON cannot close its own script element.
  const json = useMemo(() => JSON.stringify(buildReviewData(state, current, summary)).replace(/</g, '\\u003c'), [state, current, summary]);
  return <script type="application/json" id="rs-review-data" dangerouslySetInnerHTML={{ __html: json }} />;
};
