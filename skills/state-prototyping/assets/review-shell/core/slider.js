// The Before and After slider: the split is the percentage of the stage that shows Before. Pure helpers, no DOM.
import { DEFAULT_SPLIT, SPLIT_STEP, SPLIT_STEP_LARGE } from './constants.js';

const SPLIT_MIN = 0;
const SPLIT_MAX = 100;

export const clampSplit = (value) => (Number.isFinite(value) ? Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(value))) : DEFAULT_SPLIT);

// Left and Right move 1%, with Shift 10%. Home and End go to the ends, Enter centres. Anything else returns null.
export const getSplitFromKey = ({ key, shiftKey }, currentSplit) => {
  const step = shiftKey ? SPLIT_STEP_LARGE : SPLIT_STEP;
  if (key === 'ArrowLeft') return clampSplit(currentSplit - step);
  if (key === 'ArrowRight') return clampSplit(currentSplit + step);
  if (key === 'Home') return SPLIT_MIN;
  if (key === 'End') return SPLIT_MAX;
  if (key === 'Enter') return DEFAULT_SPLIT;
  return null;
};

export const getSplitFromPointer = (clientX, bounds) => (bounds.width > 0 ? clampSplit(((clientX - bounds.left) / bounds.width) * 100) : DEFAULT_SPLIT);

export const getSplitValueText = (split) => `${split}% Before`;
