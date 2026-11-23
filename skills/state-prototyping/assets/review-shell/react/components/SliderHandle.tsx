// The Before and After divider: a keyboard- and pointer-operable slider. The split lives in the store;
// this turns input into `set-split` actions and keeps the ARIA value in step.
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { DEFAULT_SPLIT } from '../../core/constants.js';
import { buildIconSvg } from '../../core/icons.js';
import { getSplitFromKey, getSplitFromPointer, getSplitValueText } from '../../core/slider.js';
import { useReview } from '../review-context';

export const SliderHandle = ({ split, boundsRef }: { split: number; boundsRef: RefObject<HTMLDivElement> }) => {
  const { store } = useReview();
  const setSplit = (value: number) => store.dispatch({ type: 'set-split', value });

  // Pointer capture stays on the handle only, so a drag over a preview iframe keeps working.
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    event.preventDefault();
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !boundsRef.current) return;
    setSplit(getSplitFromPointer(event.clientX, boundsRef.current.getBoundingClientRect()));
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const nextSplit = getSplitFromKey(event, store.getState().split);
    if (nextSplit === null) return;
    event.preventDefault();
    setSplit(nextSplit);
  };

  return (
    <div
      className="rs-divider"
      id="rs-divider"
      role="slider"
      tabIndex={0}
      aria-label="Before and After divider"
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={split}
      aria-valuetext={getSplitValueText(split)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => setSplit(DEFAULT_SPLIT)}
    >
      <span className="rs-grip" id="rs-grip" dangerouslySetInnerHTML={{ __html: buildIconSvg('grip') }} />
    </div>
  );
};
