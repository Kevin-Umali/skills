// Outlines and numbered badges over the previews. Outlines never block the preview; badges and inspect mode take clicks.
// A redraw reads every rectangle first, then writes. When the set of boxes is unchanged it moves the boxes already there.
import { CHANGES_ACTIVE, FRAME_SIDES } from '../core/constants.js';
import { buildHighlightBoxes, findBoxAtPoint, getHighlightMode } from '../core/highlight-geometry.js';
import { byId, createButton, createElement } from './dom.js';

const toSignature = (boxes, state) =>
  [getHighlightMode(state), state.selectedChange, state.hoveredChange, ...boxes.map((box) => `${box.side}${box.index}:${box.badge?.indexes.join('.') ?? ''}`)].join(',');

export const createHighlights = ({ dispatch, getState }) => {
  const layers = Object.fromEntries(FRAME_SIDES.map((side) => [side, byId(`rs-hl-${side}`)]));
  const boxesBySide = { before: [], after: [] };
  const signaturesBySide = { before: '', after: '' };
  const diffsBySide = { before: null, after: null };

  const placeBox = (boxElement, box) => {
    Object.assign(boxElement.style, { left: `${box.rect.left}px`, top: `${box.rect.top}px`, width: `${box.rect.width}px`, height: `${box.rect.height}px` });
    if (!box.badge) return;
    const badge = boxElement.firstElementChild;
    badge.style.left = `${box.badge.left}px`;
    badge.style.top = `${box.badge.top}px`;
  };

  // A badge that stands for several overlapping changes marks them in the inspector list while it is hovered or focused.
  const createGroupBadge = ({ indexes, label }, state) => {
    const isHovered = indexes.includes(state.hoveredChange);
    const badge = createButton(label, {
      className: `rs-hl-num rs-hl-num--group${isHovered ? ' is-hover' : ''}`,
      dataset: { changes: indexes.join(',') },
      attributes: { 'aria-label': `${indexes.length} changes: ${indexes.map((index) => index + 1).join(', ')}` },
    });
    const link = () => dispatch({ type: 'link-changes', indexes });
    const unlink = () => dispatch({ type: 'link-changes', indexes: [] });
    badge.addEventListener('pointerenter', link);
    badge.addEventListener('focus', link);
    badge.addEventListener('blur', unlink);
    // A finger has no hover, so its link stays until another change is picked.
    badge.addEventListener('pointerleave', (event) => { if (event.pointerType !== 'touch') unlink(); });
    badge.addEventListener('click', link);
    return badge;
  };

  const createSingleBadge = (box, state) => {
    const badge = createButton(box.badge.label, {
      className: 'rs-hl-num',
      attributes: { 'aria-label': `Change ${box.index + 1}: ${state.diff.entries[box.index].label}` },
    });
    badge.addEventListener('click', () => {
      dispatch({ type: 'select-change', index: box.index });
      dispatch({ type: 'set-inspector', isOpen: true });
    });
    return badge;
  };

  const createBox = (box, state) => {
    const classNames = ['rs-hl-box', `rs-hl-box--${box.side}`];
    if (state.selectedChange === box.index) classNames.push('is-selected');
    if (state.hoveredChange === box.index) classNames.push('is-hover');
    const boxElement = createElement('div', { className: classNames.join(' '), dataset: { index: String(box.index) } });
    if (box.badge) boxElement.append(box.badge.indexes.length > 1 ? createGroupBadge(box.badge, state) : createSingleBadge(box, state));
    placeBox(boxElement, box);
    return boxElement;
  };

  const render = (state = getState()) => {
    if (!CHANGES_ACTIVE) return;
    const showBoxes = state.highlight || state.isInspecting;
    // Read phase: every rectangle of both sides, before any style is written.
    FRAME_SIDES.forEach((side) => {
      const bounds = { width: layers[side].clientWidth, height: layers[side].clientHeight };
      boxesBySide[side] = showBoxes ? buildHighlightBoxes(state.diff, side, { ...state, bounds }) : [];
    });
    // Write phase.
    FRAME_SIDES.forEach((side) => {
      const boxes = boxesBySide[side];
      const layer = layers[side];
      layer.dataset.inspecting = String(state.isInspecting && boxes.length > 0);
      layer.dataset.mode = getHighlightMode(state);
      const signature = toSignature(boxes, state);
      if (signature === signaturesBySide[side] && state.diff === diffsBySide[side]) {
        boxes.forEach((box, position) => placeBox(layer.children[position], box));
        return;
      }
      signaturesBySide[side] = signature;
      diffsBySide[side] = state.diff;
      layer.replaceChildren(...boxes.map((box) => createBox(box, state)));
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

  return { render };
};
