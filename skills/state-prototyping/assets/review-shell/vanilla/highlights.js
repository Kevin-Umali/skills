// Outlines and numbered badges over the previews. Outlines never block the preview; badges and inspect mode take clicks.
import { FRAME_SIDES } from '../core/constants.js';
import { buildHighlightBoxes, findBoxAtPoint } from '../core/highlight-geometry.js';
import { byId, createButton, createElement } from './dom.js';

export const createHighlights = ({ dispatch, getState }) => {
  const layers = Object.fromEntries(FRAME_SIDES.map((side) => [side, byId(`rs-hl-${side}`)]));
  const boxesBySide = { before: [], after: [] };

  const createBox = (box, state) => {
    const classNames = ['rs-hl-box', `rs-hl-box--${box.side}`];
    if (state.selectedChange === box.index) classNames.push('is-selected');
    if (state.hoveredChange === box.index) classNames.push('is-hover');
    const boxElement = createElement('div', { className: classNames.join(' '), dataset: { index: String(box.index) } });
    Object.assign(boxElement.style, {
      left: `${box.rect.left}px`, top: `${box.rect.top}px`, width: `${box.rect.width}px`, height: `${box.rect.height}px`,
    });
    const entry = state.diff.entries[box.index];
    const badge = createButton(String(box.index + 1), {
      className: 'rs-hl-num',
      attributes: { 'aria-label': `Change ${box.index + 1}: ${entry.label}` },
    });
    badge.style.top = `${-11 + box.badgeOffsetY}px`;
    badge.addEventListener('click', () => {
      dispatch({ type: 'select-change', index: box.index });
      dispatch({ type: 'set-inspector', isOpen: true });
    });
    boxElement.append(badge);
    return boxElement;
  };

  const render = (state) => {
    const showBoxes = state.highlight || state.isInspecting;
    FRAME_SIDES.forEach((side) => {
      boxesBySide[side] = showBoxes ? buildHighlightBoxes(state.diff, side, state) : [];
      layers[side].dataset.inspecting = String(state.isInspecting && boxesBySide[side].length > 0);
      layers[side].replaceChildren(...boxesBySide[side].map((box) => createBox(box, state)));
    });
  };

  // Inspect mode: the smallest changed element under the pointer is hovered, and a click selects it.
  FRAME_SIDES.forEach((side) => {
    const layer = layers[side];
    const getPointerBox = (event) => {
      const layerRect = layer.getBoundingClientRect();
      return findBoxAtPoint(boxesBySide[side], { x: event.clientX - layerRect.left, y: event.clientY - layerRect.top });
    };
    layer.addEventListener('pointermove', (event) => {
      if (!getState().isInspecting) return;
      const hoveredIndex = getPointerBox(event)?.index ?? null;
      if (hoveredIndex !== getState().hoveredChange) dispatch({ type: 'hover-change', index: hoveredIndex });
    });
    layer.addEventListener('pointerleave', () => {
      if (getState().isInspecting) dispatch({ type: 'hover-change', index: null });
    });
    layer.addEventListener('click', (event) => {
      if (!getState().isInspecting || event.target.closest('.rs-hl-num')) return;
      const box = getPointerBox(event);
      if (box) dispatch({ type: 'select-change', index: box.index });
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && getState().isInspecting) dispatch({ type: 'set-inspecting', isInspecting: false });
  });

  return { render };
};
