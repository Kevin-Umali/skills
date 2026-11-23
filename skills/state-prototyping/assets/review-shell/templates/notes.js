// Review notes, read by the shell. Leave empty until highlights are on and areas change.
//
// notes.lockedAreas  area ids the user approved (frozen)
// notes.shared       lines about changes in every state
// notes.areas        { [areaId]: lines }
// notes.states       { [stateId]: lines }   one line each saying what renders differently
// reasons            { selector, props?: [cssProperty], why }  intent, from the user's point of view
export const notes = { lockedAreas: [], shared: [], areas: {}, states: {} };
export const reasons = [];
