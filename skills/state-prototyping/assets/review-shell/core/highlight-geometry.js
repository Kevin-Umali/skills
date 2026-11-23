// Turns the measured diff into outline boxes with badges, and answers which box is under a point.
// What is drawn depends on the mode (see getHighlightMode), so a quiet resting view stays readable and a selected change is clear.
import { BADGE_OFFSET_PX, BADGE_SIZE_PX, BOX_PADDING_PX } from './constants.js';

const toBoxRect = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left - BOX_PADDING_PX,
    top: rect.top - BOX_PADDING_PX,
    width: rect.width + BOX_PADDING_PX * 2,
    height: rect.height + BOX_PADDING_PX * 2,
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

const overlaps = (first, second) =>
  first.left < second.left + second.width && second.left < first.left + first.width
  && first.top < second.top + second.height && second.top < first.top + first.height;

const contains = (outer, inner) =>
  outer.left <= inner.left && outer.top <= inner.top
  && outer.left + outer.width >= inner.left + inner.width && outer.top + outer.height >= inner.top + inner.height;

/**
 * What the highlight layer shows. shell.css reads it from `data-mode` on the layer.
 * - `inspect`: Select on preview is on. Every change is outlined and numbered so any of them can be picked.
 * - `selected`: one change is selected. Only that one is drawn, on both sides, with a full outline and its badge.
 * - `listed`: the inspector is open and nothing is selected. Quiet outlines and a badge for every listed change.
 * - `resting`: nothing else is open. Quiet outlines on the innermost changed elements; a badge appears on hover.
 */
export const getHighlightMode = ({ isInspecting, selectedChange, isInspectorOpen }) => {
  if (isInspecting) return 'inspect';
  if (selectedChange !== null) return 'selected';
  return isInspectorOpen ? 'listed' : 'resting';
};

// With nothing selected only After is outlined (the only visible side in Before and After views). Everything else shows both.
const isSideShown = (side, mode, compare) => {
  const isVisible = compare === 'split' || compare === 'slider' || compare === side;
  if (!isVisible) return false;
  if (mode === 'inspect' || mode === 'selected') return true;
  return compare === 'split' || compare === 'slider' ? side === 'after' : true;
};

// An outline around a container adds nothing when the changed elements inside it are already outlined.
// The container stays in the inspector list.
const keepInnermost = (candidates) =>
  candidates.filter((candidate) => !candidates.some((other) => other !== candidate && candidate.element.contains(other.element)));

const getBadgeCandidates = ({ left, top, width, height }) => [
  { left, top: top - BADGE_SIZE_PX - BADGE_OFFSET_PX }, // just above the top-left corner
  { left: left - BADGE_SIZE_PX - BADGE_OFFSET_PX, top }, // to the left, when there is no room above
  { left: left + width + BADGE_OFFSET_PX, top }, // then to the right, then below, when a neighbour is in the way
  { left, top: top + height + BADGE_OFFSET_PX },
];

const toSquare = ({ left, top }) => ({ left, top, width: BADGE_SIZE_PX, height: BADGE_SIZE_PX });

const getOverlapArea = (first, second) =>
  Math.max(0, Math.min(first.left + first.width, second.left + second.width) - Math.max(first.left, second.left))
  * Math.max(0, Math.min(first.top + first.height, second.top + second.height) - Math.max(first.top, second.top));

// The badge goes outside its box and inside the frame. Of the places that fit, the first (above, left, right, below)
// that covers no other changed element (`obstacles`, drawn or not) wins; if every place covers one, the least covering wins.
// A box that fills the frame has no outside place, so its badge sits in the corner. Positions are in layer coordinates.
const pickBadgePosition = (box, obstacles, bounds) => {
  const fitted = getBadgeCandidates(box.rect).map(({ left, top }) => ({
    left: clamp(left, 0, bounds.width - BADGE_SIZE_PX),
    top: clamp(top, 0, bounds.height - BADGE_SIZE_PX),
  }));
  const neighbours = obstacles.filter((other) => other.index !== box.index && !contains(other.rect, box.rect)); // not its containers
  const getCoveredArea = (position) => neighbours.reduce((total, other) => total + getOverlapArea(toSquare(position), other.rect), 0);
  const outside = fitted.filter((position) => !overlaps(toSquare(position), box.rect));
  return outside.reduce((best, position) => (getCoveredArea(position) < getCoveredArea(best) ? position : best), outside[0]) ?? fitted[0];
};

// Badges that would land within one badge size of each other share a single badge showing how many there are.
// Overlap is transitive, so no two remaining badges touch.
const groupBadges = (placed) => {
  const roots = placed.map((_, position) => position);
  const findRoot = (position) => {
    while (roots[position] !== position) position = roots[position];
    return position;
  };
  placed.forEach((first, firstPosition) => placed.forEach((second, secondPosition) => {
    if (secondPosition <= firstPosition) return;
    if (Math.abs(first.left - second.left) < BADGE_SIZE_PX && Math.abs(first.top - second.top) < BADGE_SIZE_PX) {
      roots[findRoot(secondPosition)] = findRoot(firstPosition);
    }
  }));
  const groups = new Map();
  placed.forEach((item, position) => {
    const root = findRoot(position);
    groups.set(root, [...(groups.get(root) ?? []), item]);
  });
  return [...groups.values()];
};

// Each box carries `badge`: null, or { left, top (relative to the box), label, indexes }.
// A group's badge sits on its first box. `indexes` lists every change it stands for.
const placeBadges = (boxes, obstacles, bounds, { collapse }) => {
  const placed = boxes.map((box) => ({ box, ...pickBadgePosition(box, obstacles, bounds) }));
  const groups = collapse ? groupBadges(placed) : placed.map((item) => [item]);
  const badgesByBox = new Map(groups.map(([leader, ...rest]) => {
    const indexes = [leader, ...rest].map(({ box }) => box.index);
    const label = indexes.length > 1 ? String(indexes.length) : String(leader.box.index + 1);
    return [leader.box, { left: leader.left - leader.box.rect.left, top: leader.top - leader.box.rect.top, label, indexes }];
  }));
  return boxes.map((box) => ({ ...box, badge: badgesByBox.get(box) ?? null }));
};

/**
 * Reads element rectangles, so call it for every side before changing any DOM.
 * @param {object} diff the measured diff
 * @param {'before' | 'after'} side which preview the boxes are drawn over
 * @param {{ compare: string, selectedChange: number | null, isInspecting: boolean, isInspectorOpen: boolean, bounds: { width: number, height: number } }} options
 *   `bounds` is the size of the frame the boxes are drawn in.
 * @returns {Array<{ index: number, side: 'before' | 'after', rect: { left: number, top: number, width: number, height: number }, badge: { left: number, top: number, label: string, indexes: number[] } | null }>}
 */
export const buildHighlightBoxes = (diff, side, options) => {
  const mode = getHighlightMode(options);
  if (!diff || !isSideShown(side, mode, options.compare)) return [];
  const elementKey = side === 'after' ? 'afterElement' : 'beforeElement';
  const frameRect = { left: 0, top: 0, width: options.bounds.width, height: options.bounds.height };
  const connected = diff.entries
    .map((entry, index) => ({ index, side, element: entry[elementKey] }))
    .filter(({ element }) => element.isConnected) // the preview re-rendered and dropped this element
    .map((candidate) => ({ ...candidate, rect: toBoxRect(candidate.element) }));
  const candidates = connected.filter(({ index }) => mode !== 'selected' || index === options.selectedChange);
  const boxes = (mode === 'resting' ? keepInnermost(candidates) : candidates)
    // Elements scrolled out of the frame are not drawn, except a selected one, whose badge stays at the edge to say so.
    .filter(({ rect }) => mode === 'selected' || overlaps(rect, frameRect))
    .map(({ index, rect }) => ({ index, side, rect }));
  return placeBadges(boxes, connected, options.bounds, { collapse: mode === 'listed' || mode === 'inspect' });
};

const getArea = ({ width, height }) => width * height;

// In inspect mode the smallest box under the pointer wins, so nested elements stay reachable.
export const findBoxAtPoint = (boxes, point) =>
  boxes
    .filter(({ rect }) => point.x >= rect.left && point.x <= rect.left + rect.width && point.y >= rect.top && point.y <= rect.top + rect.height)
    .sort((first, second) => getArea(first.rect) - getArea(second.rect))[0] ?? null;
