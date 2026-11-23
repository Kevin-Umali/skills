// The stage: Before and After previews, the slider, inline notices, and an off-screen probe so the diff also works
// when only one side is shown. With change tracking off there is no probe and no diff session.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, MutableRefObject } from 'react';
import { CHANGES_ACTIVE, COMPARISON_ENABLED, FRAME_BASE_URL, FRAME_SIDES, HEIGHT_CHECK_DELAY_MS } from '../../core/constants.js';
import { buildStageNotices, hasHeightMismatch } from '../../core/stage-notices.js';
import { buildFrameUrl } from '../../core/view-state.js';
import { HIDDEN_SIDE_BY_COMPARE, syncProbeSize, usePreviewSession } from '../hooks/use-preview-session';
import { useReview, useReviewPart } from '../review-context';
import type { FrameRefs, FrameSide, ReviewAction } from '../types';
import { HighlightLayer } from './HighlightLayer';
import { SliderHandle } from './SliderHandle';

const FRAME_HEADINGS: Record<FrameSide, { name: string; hint: string }> = {
  before: { name: 'Before', hint: ' · frozen' },
  after: { name: COMPARISON_ENABLED ? 'After' : 'Preview', hint: ' · editable' },
};

const setFrameSource = (iframe: HTMLIFrameElement | null, url: string) => {
  if (iframe && iframe.getAttribute('src') !== url) iframe.src = url;
};

export const PreviewFrames = ({ frames }: { frames: MutableRefObject<FrameRefs> }) => {
  const { store, reasons } = useReview();
  const state = useReviewPart('stage');
  const framesRef = useRef<HTMLDivElement>(null);
  const [measuredFrameWidth, setMeasuredFrameWidth] = useState(0);
  const [heightsDiffer, setHeightsDiffer] = useState(false);
  const heightTimerId = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(heightTimerId.current), []);

  // Slider mode lines the two documents up, so a height difference gets a notice.
  const checkHeights = () => {
    clearTimeout(heightTimerId.current);
    heightTimerId.current = setTimeout(() => {
      const [beforeHeight, afterHeight] = FRAME_SIDES.map((side: FrameSide) => frames.current[side]?.contentDocument?.documentElement.scrollHeight ?? 0);
      setHeightsDiffer(Boolean(beforeHeight && afterHeight) && hasHeightMismatch(beforeHeight, afterHeight));
    }, HEIGHT_CHECK_DELAY_MS);
  };
  usePreviewSession({ store, frames, reasons, onFrameLoad: COMPARISON_ENABLED ? checkHeights : () => {} });

  const getBeforeWidth = () => Math.round(frames.current.before?.closest('.rs-frame-wrap')?.getBoundingClientRect().width ?? 0);

  // The previews follow the view. A hidden side keeps its last source and is not loaded.
  useLayoutEffect(() => {
    FRAME_SIDES.forEach((side: FrameSide) => {
      const isVisible = state.compare === 'split' || state.compare === 'slider' || state.compare === side;
      if (isVisible) setFrameSource(frames.current[side], buildFrameUrl(FRAME_BASE_URL, side, state, state.resetCount));
    });
    const hiddenSide = HIDDEN_SIDE_BY_COMPARE[state.compare];
    if (frames.current.probe && hiddenSide) {
      syncProbeSize(frames.current, state.compare);
      setFrameSource(frames.current.probe, buildFrameUrl(FRAME_BASE_URL, hiddenSide, state, state.resetCount));
    }
    setMeasuredFrameWidth(state.compare === 'split' ? getBeforeWidth() : 0);
    if (state.compare !== 'slider') setHeightsDiffer(false);
    else checkHeights();
  }, [state.compare, state.width, state.theme, state.stateId, state.resetCount]);

  // The narrow-frame notice needs the real width of a frame, so it follows the frames' size.
  useEffect(() => {
    if (!COMPARISON_ENABLED || !framesRef.current) return undefined;
    const observer = new ResizeObserver(() => {
      if (store.getState().compare === 'split') setMeasuredFrameWidth(getBeforeWidth());
    });
    observer.observe(framesRef.current);
    return () => observer.disconnect();
  }, [store]);

  const isFit = state.width === 'fit';
  const framesStyle = { '--rs-split': `${state.split}%`, ...(isFit ? {} : { '--rs-frame-width': `${Number(state.width) + 2}px` }) } as CSSProperties;
  const notices = COMPARISON_ENABLED ? buildStageNotices({ compare: state.compare, width: state.width, frameWidth: measuredFrameWidth, heightsDiffer }) : [];

  return (
    <section className="rs-stage" id="rs-stage" data-region="stage" aria-label="Preview">
      <div className="rs-notices" id="rs-notices">
        {notices.map((notice: { id: string; message: string; actionLabel: string; action: object }) => (
          <div key={notice.id} className="rs-notice" role="status" data-notice={notice.id}>
            <span>{notice.message}</span>
            <button type="button" className="rs-btn" onClick={() => store.dispatch(notice.action as ReviewAction)}>{notice.actionLabel}</button>
          </div>
        ))}
      </div>
      <div className="rs-frames" id="rs-frames" ref={framesRef} data-compare={state.compare} data-width={isFit ? 'fit' : 'fixed'} style={framesStyle}>
        {FRAME_SIDES.map((side: FrameSide) => {
          const isAfter = side === 'after';
          const isVisible = state.compare === 'split' || state.compare === 'slider' || state.compare === side;
          return (
            <div className="rs-frame-wrap" id={`rs-wrap-${side}`} key={side} hidden={!isVisible}>
              <div className="rs-frame-head">
                <span id={isAfter ? 'rs-after-name' : undefined}>{FRAME_HEADINGS[side].name}</span>
                <span className="rs-hint" id={isAfter ? 'rs-after-hint' : undefined} hidden={isAfter && !COMPARISON_ENABLED}>{FRAME_HEADINGS[side].hint}</span>
              </div>
              <div className="rs-frame-body">
                <iframe id={`rs-frame-${side}`} title={isAfter ? 'After preview' : 'Before preview'} ref={(element) => { frames.current[side] = element; }} />
                <HighlightLayer side={side} />
              </div>
            </div>
          );
        })}
        <SliderHandle split={state.split} boundsRef={framesRef} />
      </div>
      {CHANGES_ACTIVE && (
        <iframe className="rs-probe" title="Off-screen measurement" aria-hidden="true" tabIndex={-1} ref={(element) => { frames.current.probe = element; }} />
      )}
    </section>
  );
};
