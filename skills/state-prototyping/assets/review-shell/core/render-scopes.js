// Which parts of the shell an action can change. A view layer re-renders only those parts, and skips the rest:
// hovering a change does not touch the toolbar or the sidebar, and a popover does not touch the previews.
export const RENDER_PARTS = ['toolbar', 'sidebar', 'stage', 'highlights', 'inspector', 'data', 'announcer'];

// These actions change what the previews render, so the diff is measured again.
export const MEASURE_TRIGGER_ACTIONS = new Set(['select-state', 'set-view', 'reset-preview']);

// \`data\` publishes selectedChange, so every action that can change the selection includes it.
const CHANGE_SELECTION_PARTS = ['highlights', 'inspector', 'data'];

const PARTS_BY_ACTION = {
  'select-state': RENDER_PARTS,
  'set-view': ['toolbar', 'stage', 'highlights', 'inspector', 'data', 'announcer'],
  'set-split': ['stage', 'data'],
  'toggle-highlight': ['highlights', 'inspector'],
  'set-query': ['sidebar'],
  'reset-preview': ['stage', 'highlights', 'inspector', 'data'],
  measuring: ['inspector'],
  'diff-ready': ['toolbar', 'highlights', 'inspector', 'data'],
  'diff-failed': ['toolbar', 'highlights', 'inspector', 'data'],
  'select-change': CHANGE_SELECTION_PARTS,
  'step-change': CHANGE_SELECTION_PARTS,
  'hover-change': ['highlights'],
  'link-changes': ['inspector'],
  'set-category-filter': CHANGE_SELECTION_PARTS,
  // Inspecting opens the inspector, so the toolbar's Changes button follows.
  'set-inspecting': ['toolbar', 'highlights', 'inspector'],
  'set-inspector': ['toolbar', 'inspector', 'highlights'],
  'set-sidebar': ['toolbar', 'sidebar'],
  'set-popover': ['toolbar', 'sidebar'],
};

export const getRenderParts = (actionType) => PARTS_BY_ACTION[actionType] ?? RENDER_PARTS;
