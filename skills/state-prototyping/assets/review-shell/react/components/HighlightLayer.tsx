// Outlines and numbered badges over one preview. Outlines never block the preview; badges and inspect mode take clicks.
// A redraw reads the rectangles first, then React writes. When the boxes are unchanged nothing is re-rendered.
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { CHANGES_ACTIVE } from '../../core/constants.js';
import { buildHighlightBoxes, findBoxAtPoint, getHighlightMode } from '../../core/highlight-geometry.js';
import { createFrameScheduler } from '../../core/scheduling.js';
import { useReview, useReviewPart } from '../review-context';
import type { FrameSide } from '../types';

interface HighlightBox {
  index: number;
  side: FrameSide;
  label: string;
  rect: { left: number; top: number; width: number; height: number };
  // A badge that stands for several overlapping changes lists them all in `indexes`; boxes inside a group have none.
  badge: { left: number; top: number; label: string; indexes: number[] } | null;
}

const areBadgesEqual = (first: HighlightBox['badge'], second: HighlightBox['badge']) =>
  first === second || Boolean(first && second && first.left === second.left && first.top === second.top && first.label === second.label && first.indexes.join() === second.indexes.join());

const areBoxesEqual = (first: HighlightBox[], second: HighlightBox[]) =>
  first.length === second.length && first.every((box, position) => {
    const other = second[position];
    return box.index === other.index && box.label === other.label && areBadgesEqual(box.badge, other.badge)
      && box.rect.left === other.rect.left && box.rect.top === other.rect.top && box.rect.width === other.rect.width && box.rect.height === other.rect.height;
  });

const Badge = ({ box, badge, hoveredChange }: { box: HighlightBox; badge: NonNullable<HighlightBox['badge']>; hoveredChange: number | null }) => {
  const { store } = useReview();
  const { dispatch } = store;
  const style = { left: badge.left, top: badge.top };
  if (badge.indexes.length === 1) {
    return (
      <button
        type="button"
        className="rs-hl-num"
        style={style}
        aria-label={`Change ${box.index + 1}: ${box.label}`}
        onClick={() => {
          dispatch({ type: 'select-change', index: box.index });
          dispatch({ type: 'set-inspector', isOpen: true });
        }}
      >
        {badge.label}
      </button>
    );
  }
  // A group badge marks the changes it stands for in the inspector list while it is hovered or focused.
  const link = () => dispatch({ type: 'link-changes', indexes: badge.indexes });
  const unlink = () => dispatch({ type: 'link-changes', indexes: [] });
  return (
    <button
      type="button"
      className={`rs-hl-num rs-hl-num--group${hoveredChange !== null && badge.indexes.includes(hoveredChange) ? ' is-hover' : ''}`}
      style={style}
      data-changes={badge.indexes.join(',')}
      aria-label={`${badge.indexes.length} changes: ${badge.indexes.map((index) => index + 1).join(', ')}`}
      onPointerEnter={link}
      onFocus={link}
      onBlur={unlink}
      onPointerLeave={(event) => { if (event.pointerType !== 'touch') unlink(); }}
      onClick={link}
    >
      {badge.label}
    </button>
  );
};

// Memoised, so the slider and notices re-rendering the stage do not redraw the outlines.
export const HighlightLayer = memo(({ side }: { side: FrameSide }) => {
  const { store } = useReview();
  const state = useReviewPart('highlights');
  const layerRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<HighlightBox[]>([]);
  const boxesRef = useRef(boxes);
  boxesRef.current = boxes;
  const stateRef = useRef(state);
  stateRef.current = state;

  const redraw = useCallback(() => {
    const layer = layerRef.current;
    const current = stateRef.current;
    if (!layer || !CHANGES_ACTIVE) return;
    const showBoxes = current.highlight || current.isInspecting;
    const bounds = { width: layer.clientWidth, height: layer.clientHeight };
    const nextBoxes: HighlightBox[] = showBoxes && current.diff
      ? buildHighlightBoxes(current.diff, side, { ...current, bounds }).map((box: Omit<HighlightBox, 'label'>) => ({ ...box, label: current.diff?.entries[box.index]?.label ?? '' }))
      : [];
    setBoxes((previous) => (areBoxesEqual(previous, nextBoxes) ? previous : nextBoxes));
  }, [side]);

  useLayoutEffect(redraw, [redraw, state]);

  // Scrolling and resizing a preview move the elements, so the boxes follow once per animation frame.
  useEffect(() => {
    if (!CHANGES_ACTIVE) return undefined;
    const scheduler = createFrameScheduler(redraw);
    const stopListening = store.onLayoutChange(scheduler.schedule);
    return () => {
      stopListening();
      scheduler.cancel();
    };
  }, [store, redraw]);

  // Inspect mode: the smallest changed element under the pointer is hovered, and a click selects it.
  const getPointerBox = (event: PointerEvent | MouseEvent) => {
    const layerRect = event.currentTarget.getBoundingClientRect();
    return findBoxAtPoint(boxesRef.current, { x: event.clientX - layerRect.left, y: event.clientY - layerRect.top }) as HighlightBox | null;
  };
  const handlePointerMove = (event: PointerEvent) => {
    if (!store.getState().isInspecting) return;
    const hoveredIndex = getPointerBox(event)?.index ?? null;
    if (hoveredIndex !== store.getState().hoveredChange) store.dispatch({ type: 'hover-change', index: hoveredIndex });
  };
  const handlePointerLeave = () => {
    if (store.getState().isInspecting) store.dispatch({ type: 'hover-change', index: null });
  };
  const handleClick = (event: MouseEvent) => {
    if (!store.getState().isInspecting || (event.target as Element).closest('.rs-hl-num')) return;
    const box = getPointerBox(event);
    if (box) store.dispatch({ type: 'select-change', index: box.index });
  };

  return (
    <div
      className="rs-hl"
      id={`rs-hl-${side}`}
      ref={layerRef}
      data-inspecting={CHANGES_ACTIVE ? String(state.isInspecting && boxes.length > 0) : undefined}
      data-mode={CHANGES_ACTIVE ? getHighlightMode(state) : undefined}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {boxes.map((box) => {
        const classNames = ['rs-hl-box', `rs-hl-box--${box.side}`];
        if (state.selectedChange === box.index) classNames.push('is-selected');
        if (state.hoveredChange === box.index) classNames.push('is-hover');
        return (
          <div key={box.index} className={classNames.join(' ')} data-index={box.index} style={{ ...box.rect }}>
            {box.badge && <Badge box={box} badge={box.badge} hoveredChange={state.hoveredChange} />}
          </div>
        );
      })}
    </div>
  );
});

HighlightLayer.displayName = 'HighlightLayer';
