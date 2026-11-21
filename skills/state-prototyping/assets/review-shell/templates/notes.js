// Review notes. The shell reads this module; it never hard-codes notes.

// Short plain-language notes about what renders differently in After. Sidebar markers come from these.
export const notes = {
  lockedAreas: [], // area ids the user has approved. A locked area is frozen until they reopen it.
  shared: ['Example: buttons give a subtle press response.'],
  areas: { main: ['Example: fields share one consistent width.'] },
  states: { 'recovery-error': ['Example: the error message sits under the field.'] },
};

// Agent-written reasons, matched to measured differences by selector and, optionally, by property.
// They explain intent. The numbers next to them come from the rendered DOM, not from this file.
// A measured change with no matching reason shows "No reason recorded for this change."
export const reasons = [
  { selector: 'button', props: ['height'], why: 'Example: one size rule for controls, so they line up and are easy to hit.' },
];
