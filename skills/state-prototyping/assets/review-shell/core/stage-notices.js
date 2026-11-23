// Inline notices above the previews. Pure: the view layers measure the frames and render what this returns.
import { HEIGHT_MISMATCH_TOLERANCE_PX, MIN_SPLIT_FRAME_WIDTH_PX } from './constants.js';

export const hasHeightMismatch = (beforeHeight, afterHeight) => Math.abs(beforeHeight - afterHeight) > HEIGHT_MISMATCH_TOLERANCE_PX;

/**
 * @param {{ compare: string, width: string, frameWidth: number, heightsDiffer: boolean }} measurements
 * @returns {Array<{ id: string, message: string, actionLabel: string, action: object }>}
 */
export const buildStageNotices = ({ compare, width, frameWidth, heightsDiffer }) => {
  const notices = [];
  if (compare === 'split' && width === 'fit' && frameWidth > 0 && frameWidth < MIN_SPLIT_FRAME_WIDTH_PX) {
    notices.push({
      id: 'narrow-split',
      message: `Each preview is ${Math.round(frameWidth)}px wide, so the product shows its phone layout.`,
      actionLabel: 'Show After only',
      action: { type: 'set-view', key: 'compare', value: 'after' },
    });
  }
  if (compare === 'slider' && heightsDiffer) {
    notices.push({
      id: 'height-mismatch',
      message: 'Before and After have different heights, so the slider will not line up. Split is better here.',
      actionLabel: 'Use Split',
      action: { type: 'set-view', key: 'compare', value: 'split' },
    });
  }
  return notices;
};
