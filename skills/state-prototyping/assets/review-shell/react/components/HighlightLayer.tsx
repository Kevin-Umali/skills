import type { MouseEvent, PointerEvent } from 'react';
import { buildHighlightBoxes, findBoxAtPoint } from '../../core/highlight-geometry.js';
import { useReview } from '../review-context';
import type { FrameSide } from '../types';

interface HighlightBox {
  index: number;
  side: FrameSide;
  rect: { left: number; top: number; width: number; height: number };
  badgeOffsetY: number;
}

const BADGE_TOP_PX = -11;

// Outlines and numbered badges over one preview. Outlines never block the preview; badges and inspect mode take clicks.
export const HighlightLayer = ({ side }: { side: FrameSide }) => {
  const { state, dispatch } = useReview();
  const showBoxes = state.highlight || state.isInspecting;
  const boxes: HighlightBox[] = showBoxes && state.diff ? buildHighlightBoxes(state.diff, side, state) : [];

  const getPointerBox = (event: PointerEvent | MouseEvent) => {
    const layerRect = event.currentTarget.getBoundingClientRect();
    return findBoxAtPoint(boxes, { x: event.clientX - layerRect.left, y: event.clientY - layerRect.top }) as HighlightBox | null;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!state.isInspecting) return;
    const hoveredIndex = getPointerBox(event)?.index ?? null;
    if (hoveredIndex !== state.hoveredChange) dispatch({ type: 'hover-change', index: hoveredIndex });
  };

  const handleClick = (event: MouseEvent) => {
    if (!state.isInspecting || (event.target as Element).closest('.rs-hl-num')) return;
    const box = getPointerBox(event);
    if (box) dispatch({ type: 'select-change', index: box.index });
  };

  return (
    <div
      className="rs-hl"
      data-inspecting={String(state.isInspecting && boxes.length > 0)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => state.isInspecting && dispatch({ type: 'hover-change', index: null })}
      onClick={handleClick}
    >
      {boxes.map((box) => {
        const classNames = ['rs-hl-box', `rs-hl-box--${box.side}`];
        if (state.selectedChange === box.index) classNames.push('is-selected');
        if (state.hoveredChange === box.index) classNames.push('is-hover');
        return (
          <div key={`${box.side}-${box.index}`} className={classNames.join(' ')} style={{ ...box.rect }}>
            <button
              type="button"
              className="rs-hl-num"
              style={{ top: BADGE_TOP_PX + box.badgeOffsetY }}
              aria-label={`Change ${box.index + 1}: ${state.diff?.entries[box.index].label}`}
              onClick={() => {
                dispatch({ type: 'select-change', index: box.index });
                dispatch({ type: 'set-inspector', isOpen: true });
              }}
            >
              {box.index + 1}
            </button>
          </div>
        );
      })}
    </div>
  );
};
