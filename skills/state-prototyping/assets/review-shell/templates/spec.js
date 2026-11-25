// The numbers the After must render and how its files move into the project. notes.js never repeats a number.

// Project root, relative to this folder (init-prototype writes it). Paths below are relative to it.
export const projectRoot = '../..';

// Checked by measure-prototype --mode values; an area locks only when it passes.
// { area, selector, expected: { cssProperty: '14px' }, states?: [stateId], themes?: ['light' | 'dark'] }
// Rendered CSS values ('14px', '600', '#21201c'). No states: every state in the area. No themes: both.
export const values = [];

// What production keeps different after shipping, allowed by --mode parity.
// { selector, props?: [cssProperty], why }   no props: any change on that element
export const differences = [];

// Applied in order: token, shared, view, container.
// { from: 'mirror/<path>', to: '<path>', kind, base?: '<hash from mirror-file.mjs>', hook?: '<containers: the real hook>' }
export const moves = [];
