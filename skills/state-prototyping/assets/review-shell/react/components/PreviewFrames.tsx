import { useLayoutEffect } from 'react';
import type { CSSProperties, MutableRefObject } from 'react';
import { FRAME_BASE_URL, FRAME_SIDES } from '../../core/constants.js';
import { buildFrameUrl } from '../../core/view-state.js';
import { useReview } from '../review-context';
import type { FrameRefs, FrameSide } from '../types';
import { HighlightLayer } from './HighlightLayer';

const FRAME_TITLES: Record<FrameSide, { name: string; kind: string }> = {
  before: { name: 'Before', kind: 'frozen' },
  after: { name: 'After', kind: 'editable' },
};
const HIDDEN_SIDE_BY_COMPARE = { after: 'before', before: 'after' } as const;

export const PreviewFrames = ({ frames }: { frames: MutableRefObject<FrameRefs> }) => {
  const { state } = useReview();
  const isFit = state.width === 'fit';
  const hiddenSide = state.compare === 'side' ? null : HIDDEN_SIDE_BY_COMPARE[state.compare];
  const framesStyle = { '--rs-frame-width': isFit ? '' : `${Number(state.width) + 2}px` } as CSSProperties;

  // The probe renders the hidden side at the visible frame's size, so both measurements use the same viewport.
  useLayoutEffect(() => {
    const { before, after, probe } = frames.current;
    if (!hiddenSide || !probe) return;
    const visibleFrame = hiddenSide === 'before' ? after : before;
    if (!visibleFrame) return;
    probe.style.inlineSize = `${visibleFrame.offsetWidth}px`;
    probe.style.blockSize = `${visibleFrame.offsetHeight}px`;
  });

  return (
    <section className="rs-stage" aria-label="Preview">
      <div className="rs-frames" data-compare={state.compare} data-width={isFit ? 'fit' : 'fixed'} style={framesStyle}>
        {FRAME_SIDES.map((side: FrameSide) => (
          <div className="rs-frame-wrap" key={side} hidden={state.compare !== 'side' && state.compare !== side}>
            <div className="rs-frame-head">
              <span>{FRAME_TITLES[side].name} <span className="rs-hint">{FRAME_TITLES[side].kind}</span></span>
              <span>Fixture data, no network</span>
            </div>
            <div className="rs-frame-body">
              <iframe
                title={`${FRAME_TITLES[side].name} preview`}
                ref={(element) => { frames.current[side] = element; }}
                src={buildFrameUrl(FRAME_BASE_URL, side, state, state.resetCount)}
              />
              <HighlightLayer side={side} />
            </div>
          </div>
        ))}
      </div>
      <iframe
        className="rs-probe"
        title="Off-screen measurement"
        aria-hidden="true"
        tabIndex={-1}
        ref={(element) => { frames.current.probe = element; }}
        src={hiddenSide ? buildFrameUrl(FRAME_BASE_URL, hiddenSide, state, state.resetCount) : undefined}
      />
    </section>
  );
};
