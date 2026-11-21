// Turns the measured diff into outline boxes with badges, and answers which box is under a point.
import { BADGE_GAP_PX, BADGE_SIZE_PX, BOX_PADDING_PX } from './constants.js';

const toBoxRect = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left - BOX_PADDING_PX,
    top: rect.top - BOX_PADDING_PX,
    width: rect.width + BOX_PADDING_PX * 2,
    height: rect.height + BOX_PADDING_PX * 2,
  };
};

// Badges sit at each box's top-left corner. When two would overlap, the later one steps down so every badge stays clickable.
const placeBadges = (boxes) => {
  const placed = [];
  return boxes.map((box) => {
    let offsetY = 0;
    const overlaps = (candidateTop) => placed.some((other) =>
      Math.abs(other.left - box.rect.left) < BADGE_SIZE_PX && Math.abs(other.top - candidateTop) < BADGE_SIZE_PX);
    while (overlaps(box.rect.top + offsetY)) offsetY += BADGE_SIZE_PX + BADGE_GAP_PX;
    placed.push({ left: box.rect.left, top: box.rect.top + offsetY });
    return { ...box, badgeOffsetY: offsetY };
  });
};

// Which sides show boxes, and which of them.
// With a change selected, only that change is outlined, on both sides. With none selected, every change is outlined
// on After (or on Before when only Before is visible). Inspect mode shows all so any of them can be picked.
const getScope = (side, { compare, selectedChange, isInspecting }) => {
  const isVisible = compare === 'side' || compare === side;
  if (!isVisible) return 'none';
  if (isInspecting) return 'all';
  if (selectedChange !== null) return 'selected';
  if (compare === 'side') return side === 'after' ? 'all' : 'none';
  return 'all';
};

/**
 * @param {object} diff the measured diff
 * @param {'before' | 'after'} side which preview the boxes are drawn over
 * @param {{ compare: string, selectedChange: number | null, isInspecting: boolean }} options
 */
export const buildHighlightBoxes = (diff, side, options) => {
  const scope = getScope(side, options);
  if (!diff || scope === 'none') return [];
  const elementKey = side === 'after' ? 'afterElement' : 'beforeElement';
  const boxes = diff.entries
    .map((entry, index) => ({ index, element: entry[elementKey], side }))
    .filter((box) => box.element.isConnected) // the preview re-rendered and dropped this element
    .filter((box) => scope === 'all' || box.index === options.selectedChange)
    .map(({ index, element }) => ({ index, side, rect: toBoxRect(element) }));
  return placeBadges(boxes);
};

const getArea = ({ width, height }) => width * height;

// In inspect mode the smallest box under the pointer wins, so nested elements stay reachable.
export const findBoxAtPoint = (boxes, point) =>
  boxes
    .filter(({ rect }) => point.x >= rect.left && point.x <= rect.left + rect.width && point.y >= rect.top && point.y <= rect.top + rect.height)
    .sort((first, second) => getArea(first.rect) - getArea(second.rect))[0] ?? null;
