// The toolbar controls as data: ids, labels and options. The vanilla and React starters both build their controls from this,
// so labels, URL values and `data-value` hooks cannot drift between them.
import { CHANGES_ACTIVE, COMPARISON_ENABLED } from './constants.js';

/**
 * @typedef {{ value: string, label: string, title?: string }} ControlOption
 * @typedef {{ id: string, label: string, options: ControlOption[] }} ControlDefinition
 */

/** @type {Record<'compare' | 'width' | 'theme', ControlDefinition>} */
export const CONTROLS = {
  compare: {
    id: 'compare',
    label: 'Compare',
    options: [
      { value: 'before', label: 'Before', title: 'Before only' },
      { value: 'after', label: 'After', title: 'After only' },
      { value: 'split', label: 'Split', title: 'Before and After side by side' },
      { value: 'slider', label: 'Slider', title: 'Drag a divider between Before and After' },
    ],
  },
  width: {
    id: 'width',
    label: 'Preview width',
    options: [
      { value: 'fit', label: 'Fit', title: 'Fit the stage' },
      { value: '1100', label: 'Desktop', title: 'Desktop, 1100px' },
      { value: '768', label: 'Tablet', title: 'Tablet, 768px' },
      { value: '390', label: 'Phone', title: 'Phone, 390px' },
      { value: '320', label: 'Small', title: 'Small phone, 320px' },
    ],
  },
  theme: {
    id: 'theme',
    label: 'Preview theme',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
  },
};

// The Share menu. Exporting the measured changes needs change tracking.
export const SHARE_ACTIONS = [
  { value: 'copy-link', label: 'Copy link', needsChanges: false },
  { value: 'copy-markdown', label: 'Copy changes as Markdown', needsChanges: true },
  { value: 'copy-json', label: 'Copy changes as JSON', needsChanges: true },
];

export const getShareActions = () => SHARE_ACTIONS.filter((action) => !action.needsChanges || CHANGES_ACTIVE);

// With comparison off the shell shows one preview, so there is nothing to compare.
export const getControlOptions = (controlId) => (controlId === 'compare' && !COMPARISON_ENABLED ? [] : CONTROLS[controlId].options);

export const getOptionValues = (controlId) => CONTROLS[controlId].options.map((option) => option.value);

export const getOptionLabel = (controlId, value) => CONTROLS[controlId].options.find((option) => option.value === value)?.label ?? value;

export const getOptionTitle = (controlId, value) => {
  const option = CONTROLS[controlId].options.find((candidate) => candidate.value === value);
  return option?.title ?? option?.label ?? value;
};

export const getNextTheme = (theme) => (theme === 'dark' ? 'light' : 'dark');

// Said by the status region whenever the state or the view changes.
export const describeView = (areaLabel, stateLabel, view) => {
  const compare = COMPARISON_ENABLED ? `, ${getOptionLabel('compare', view.compare)}` : '';
  return `Showing ${areaLabel}: ${stateLabel}${compare}, ${getOptionLabel('width', view.width)}`;
};
