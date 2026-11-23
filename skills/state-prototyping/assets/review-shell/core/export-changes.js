// Plain, machine-readable and human-readable forms of the measured diff, so an agent or a PR can use it without vision.
import { CATEGORY_LABELS } from './constants.js';
import { countChangedProperties } from './diff.js';

export const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

export const buildChangeSummary = (state, diff) => ({
  stateId: state.id,
  stateLabel: state.label,
  elementCount: diff.entries.length,
  propertyCount: countChangedProperties(diff.entries),
  changes: diff.entries.map((entry, index) => ({
    number: index + 1,
    element: entry.label,
    categories: entry.categories,
    properties: entry.changes.map(({ property, from, to }) => ({ property, from, to })),
    reasons: entry.reasons,
  })),
  onlyInAfter: diff.added.map((item) => item.label),
  onlyInBefore: diff.removed.map((item) => item.label),
});

export const formatChangesAsJson = (summary) => JSON.stringify(summary, null, 2);

export const formatChangesAsMarkdown = (summary) => {
  const heading = `## ${summary.stateLabel}: ${pluralize(summary.elementCount, 'element')}, ${pluralize(summary.propertyCount, 'property', 'properties')} changed`;
  const sections = summary.changes.map((change) => {
    const categoryText = change.categories.map((category) => CATEGORY_LABELS[category]).join(', ');
    const lines = change.properties.map(({ property, from, to }) => `- \`${property}\`: ${from || 'none'} → ${to || 'none'}`);
    const reasonText = change.reasons.length ? `Why: ${change.reasons.join(' ')}` : 'Why: no reason recorded.';
    return [`### ${change.number}. ${change.element} (${categoryText})`, ...lines, reasonText].join('\n');
  });
  const extra = [
    summary.onlyInAfter.length ? `Only in After: ${summary.onlyInAfter.join(', ')}` : '',
    summary.onlyInBefore.length ? `Only in Before: ${summary.onlyInBefore.join(', ')}` : '',
  ].filter(Boolean);
  return [heading, ...sections, ...extra].join('\n\n');
};

// What `#rs-review-data` holds: the current view and the selected change, then the measured changes (or `measured: false`).
export const buildReviewData = (state, current, summary) => ({
  view: {
    state: state.stateId,
    compare: state.compare,
    width: state.width,
    theme: state.theme,
    split: state.split,
  },
  selectedChange: state.selectedChange === null || !summary ? null : summary.changes[state.selectedChange] ?? null,
  ...(summary ?? { stateId: current.id, measured: false }),
});
