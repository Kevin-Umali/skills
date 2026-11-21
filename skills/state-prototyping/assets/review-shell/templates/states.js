// State registry: one source for the review shell list, navigation and each preview's fixture.
// Replace these examples with the real inventory, derived from the actual app.
export const areas = [
  { id: 'main', label: 'Main' },
  { id: 'recovery', label: 'Recovery' },
];

export const states = [
  {
    id: 'main-default',
    area: 'main',
    label: 'Default',
    description: 'First view with realistic data.',
    owner: 'Where the real screen lives, or "Prototype (new UI)"',
    boundary: 'What is faked, for example "No network. fetchItems() is an in-memory fixture."',
    limits: 'What this state does not prove, for example native behavior or real timing.',
    fixture: { status: 'idle' },
  },
  {
    id: 'recovery-error',
    area: 'recovery',
    label: 'Request failed',
    description: 'The request failed and the user can retry.',
    owner: 'Where the real screen lives, or "Prototype (new UI)"',
    boundary: 'What is faked.',
    limits: 'What this state does not prove.',
    fixture: { status: 'error' },
  },
];
