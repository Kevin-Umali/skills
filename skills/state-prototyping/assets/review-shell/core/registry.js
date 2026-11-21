// Pure helpers over the state registry and the notes module. No DOM, no framework.

export const findState = (states, stateId) => states.find((state) => state.id === stateId) ?? states[0];

export const getAreaLabel = (areas, areaId) => areas.find((area) => area.id === areaId)?.label ?? areaId;

export const getAdjacentState = (states, stateId, offset) => {
  const index = states.findIndex((state) => state.id === stateId);
  return states[index + offset] ?? null;
};

export const matchesQuery = (state, areas, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const searchableText = [getAreaLabel(areas, state.area), state.label, state.id, state.description];
  return searchableText.some((text) => text.toLowerCase().includes(normalizedQuery));
};

export const isAreaLocked = (notes, areaId) => notes.lockedAreas.includes(areaId);

export const getChangeLines = (state, notes) => [
  ...(notes.states[state.id] ?? []),
  ...(notes.areas[state.area] ?? []),
];

// 'own' when the state has its own note, 'area' when only its area has one, 'shared' when only shared notes apply.
export const getChangeKind = (state, notes) => {
  if (notes.states[state.id]?.length) return 'own';
  if (notes.areas[state.area]?.length) return 'area';
  return notes.shared.length ? 'shared' : 'none';
};
