// Shared constants for the review shell. The vanilla and React starters both read these.

/** @type {ReadonlyArray<readonly [string, string]>} */
export const WIDTH_OPTIONS = [
  ['fit', 'Fit'],
  ['1100', 'Desktop 1100'],
  ['768', 'Tablet 768'],
  ['390', 'Phone 390'],
  ['320', '320'],
];
/** @type {ReadonlyArray<readonly [string, string]>} */
export const THEME_OPTIONS = [
  ['light', 'Light'],
  ['dark', 'Dark'],
];
/** @type {ReadonlyArray<readonly [string, string]>} */
export const COMPARE_OPTIONS = [
  ['before', 'Before only'],
  ['after', 'After only'],
  ['side', 'Side by side'],
];

// Before and After side by side. Set to false for a single editable preview: it lives in after/frame.html.
export const COMPARISON_ENABLED = true;
// Highlights, the measured diff and the Changes inspector. Set to false when the user does not want highlights.
export const CHANGE_TRACKING_ENABLED = true;
// Change tracking needs two previews to compare.
export const CHANGES_ACTIVE = COMPARISON_ENABLED && CHANGE_TRACKING_ENABLED;

/** @type {Array<'before' | 'after'>} */
export const FRAME_SIDES = ['before', 'after'];
export const FRAME_BASE_URL = '../'; // where before/frame.html and after/frame.html live, relative to the shell page

export const DEFAULT_VIEW = {
  theme: 'light',
  width: 'fit',
  compare: 'side',
  highlight: true,
  isSidebarOpen: true,
};

// Timing for the measured diff.
export const DIFF_DEBOUNCE_MS = 60;
export const DIFF_AFTER_INTERACTION_MS = 350;
export const DIFF_AFTER_RESIZE_MS = 250;
export const DIFF_SETTLE_POLL_MS = 100;
export const DIFF_SETTLE_MAX_POLLS = 30;
export const DIFF_SETTLE_PAUSE_MS = 60;
export const COPY_NOTICE_MS = 2200;

// What the diff measures. Width and height come from layout; the rest are computed styles.
export const BOX_PROPERTIES = ['width', 'height'];
export const STYLE_PROPERTIES = [
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'gap',
  'font-size', 'line-height', 'font-weight', 'letter-spacing', 'text-decoration-line',
  'color', 'background-color', 'fill', 'stroke', 'stroke-width',
  'border-top-left-radius', 'border-top-width', 'border-top-color', 'box-shadow',
  'transition-duration', 'animation-duration',
];
export const TEXT_PROPERTY = 'text';

// A child that only follows a changed parent for these is not a separate change.
export const INHERITED_PROPERTIES = ['font-size', 'line-height', 'font-weight', 'letter-spacing', 'color'];
// A container's size follows its children. These elements' own size is a design decision.
export const CONTROL_TAGS = new Set(['button', 'input', 'select', 'textarea', 'svg', 'img', 'circle', 'path']);
export const SKIPPED_TAGS = 'script, style';
export const TRANSPARENT_COLOR = 'rgba(0, 0, 0, 0)';
export const FILL_PARENT_TOLERANCE_PX = 1.5;

export const SIDE_PROPERTY_GROUPS = ['padding', 'margin'];

export const CATEGORY_ORDER = ['size', 'spacing', 'type', 'color', 'shape', 'motion', 'text'];
export const CATEGORY_LABELS = {
  size: 'Size',
  spacing: 'Spacing',
  type: 'Type',
  color: 'Color',
  shape: 'Shape',
  motion: 'Motion',
  text: 'Text',
};
export const CATEGORY_BY_PROPERTY = {
  width: 'size', height: 'size',
  padding: 'spacing', 'padding-inline': 'spacing', 'padding-block': 'spacing', gap: 'spacing',
  margin: 'spacing', 'margin-inline': 'spacing', 'margin-block': 'spacing',
  'font-size': 'type', 'line-height': 'type', 'font-weight': 'type', 'letter-spacing': 'type', 'text-decoration-line': 'type',
  color: 'color', 'background-color': 'color', fill: 'color', stroke: 'color', 'border-top-color': 'color',
  'border-top-left-radius': 'shape', 'border-top-width': 'shape', 'box-shadow': 'shape', 'stroke-width': 'shape',
  'transition-duration': 'motion', 'animation-duration': 'motion',
  text: 'text',
};

// Highlights.
export const BADGE_SIZE_PX = 22;
export const BADGE_GAP_PX = 2;
export const BOX_PADDING_PX = 2;
export const NARROW_WINDOW_QUERY = '(max-width: 820px)';
export const WIDE_WINDOW_QUERY = '(min-width: 1360px)';
