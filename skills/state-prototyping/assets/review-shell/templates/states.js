// State registry: one source for the shell list, navigation and each fixture.
// EXAMPLE: replace with the real inventory, or generate it with init-prototype.mjs --states.
export const areas = [{ id: 'main', label: 'Main' }];

export const states = [
  {
    id: 'main-default',
    area: 'main',
    label: 'Default',
    description: 'First view with realistic data.',
    owner: 'Where the real screen lives, or "Prototype (new UI)"',
    boundary: 'What is faked.',
    limits: 'What this state does not prove.',
    fixture: {},
  },
];
