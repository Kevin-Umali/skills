// Shared constants for the review shell. The vanilla and React starters both read these.

// Before and After side by side. Set to false for a single editable preview: it lives in after/frame.html.
export const COMPARISON_ENABLED = true;
// Highlights, the measured diff and the Changes inspector. Set to false when the user does not want highlights.
export const CHANGE_TRACKING_ENABLED = true;
// Change tracking needs two previews to compare.
export const CHANGES_ACTIVE = COMPARISON_ENABLED && CHANGE_TRACKING_ENABLED;

/** @type {Array<'before' | 'after'>} */
export const FRAME_SIDES = ['before', 'after'];
export const FRAME_BASE_URL = '../'; // where before/frame.html and after/frame.html live, relative to the shell page

// Breakpoints. shell.css repeats these three numbers in its media queries, so change both together.
export const TOOLBAR_STACK_BREAKPOINT_PX = 820; // below this the toolbar wraps to two rows
export const SIDEBAR_OVERLAY_BREAKPOINT_PX = 1100; // below this the sidebar is an overlay sheet, closed by default
export const INSPECTOR_DOCK_BREAKPOINT_PX = 1280; // from this width the inspector docks and pushes the stage
export const NARROW_WINDOW_QUERY = `(max-width: ${TOOLBAR_STACK_BREAKPOINT_PX - 1}px)`;
export const SIDEBAR_OVERLAY_QUERY = `(max-width: ${SIDEBAR_OVERLAY_BREAKPOINT_PX - 1}px)`;
export const INSPECTOR_DOCK_QUERY = `(min-width: ${INSPECTOR_DOCK_BREAKPOINT_PX}px)`;

export const SIDEBAR_WIDTH_PX = 264;
export const INSPECTOR_WIDTH_PX = 340;
export const SPLIT_MIN_STAGE_WIDTH_PX = 1000; // Split is the default compare mode only when the stage is at least this wide
export const MIN_SPLIT_FRAME_WIDTH_PX = 480; // narrower frames get a notice, because the product switches layout
export const HEIGHT_MISMATCH_TOLERANCE_PX = 8;

// The slider position is the percentage of the stage that shows Before.
export const DEFAULT_SPLIT = 50;
export const SPLIT_STEP = 1;
export const SPLIT_STEP_LARGE = 10;

export const DEFAULT_VIEW = {
  theme: 'light',
  width: 'fit',
  split: DEFAULT_SPLIT,
  highlight: true,
};

// Timing for the measured diff.
export const DIFF_DEBOUNCE_MS = 60;
export const DIFF_AFTER_INTERACTION_MS = 350;
export const DIFF_AFTER_RESIZE_MS = 250;
export const DIFF_SETTLE_POLL_MS = 100;
export const DIFF_SETTLE_MAX_POLLS = 30;
export const DIFF_READY_MAX_POLLS = 50;
export const DIFF_SETTLE_PAUSE_MS = 60;
export const DIFF_MIN_INTERVAL_MS = 500; // preview mutations re-measure at most twice a second
export const HEIGHT_CHECK_DELAY_MS = 400;
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

// Attribute changes that can move or restyle something. Other attributes (data-*, ids, handlers) do not re-measure.
export const OBSERVED_ATTRIBUTES = [
  'class', 'style', 'hidden', 'disabled', 'open', 'value', 'checked',
  'aria-expanded', 'aria-checked', 'aria-pressed', 'aria-selected', 'aria-hidden', 'aria-disabled', 'aria-current', 'aria-invalid', 'aria-busy',
];

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
// shell.css repeats the badge size (22px), so change both together.
export const BADGE_SIZE_PX = 22;
export const BADGE_OFFSET_PX = 3; // between a badge and the box it labels
export const BOX_PADDING_PX = 2;
