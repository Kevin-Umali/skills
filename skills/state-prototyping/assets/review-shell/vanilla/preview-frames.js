// The Before and After previews, plus an off-screen probe so the diff also works when only one side is shown.
import { CHANGE_TRACKING_ENABLED, FRAME_BASE_URL, FRAME_SIDES } from '../core/constants.js';
import { createDiffSession } from '../core/diff-session.js';
import { buildFrameUrl } from '../core/view-state.js';
import { byId } from './dom.js';

const HIDDEN_SIDE_BY_COMPARE = { after: 'before', before: 'after' };

export const createPreviewFrames = ({ dispatch, getState, getReasons, onLayoutChange }) => {
  const framesElement = byId('rs-frames');
  const probeFrame = byId('rs-probe');
  const frames = Object.fromEntries(FRAME_SIDES.map((side) => [side, { wrap: byId(`rs-wrap-${side}`), iframe: byId(`rs-frame-${side}`) }]));

  const getMeasuredFrames = () => {
    const { compare } = getState();
    if (compare === 'side') return { before: frames.before.iframe, after: frames.after.iframe };
    if (compare === 'after') return { before: probeFrame, after: frames.after.iframe };
    return { before: frames.before.iframe, after: probeFrame };
  };

  const session = createDiffSession({
    getMeasuredFrames,
    getReasons,
    onStart: () => dispatch({ type: 'measuring' }),
    onResult: (diff) => dispatch({ type: 'diff-ready', diff }),
    onLayoutChange,
    isEnabled: () => CHANGE_TRACKING_ENABLED,
  });

  [frames.before.iframe, frames.after.iframe, probeFrame].forEach((frame) => {
    session.attachFrame(frame);
    frame.addEventListener('load', () => frame.contentWindow.addEventListener('scroll', onLayoutChange));
  });

  const setFrameSource = (iframe, url) => {
    if (iframe.getAttribute('src') !== url) iframe.src = url;
  };

  // The probe renders the hidden side at the visible frame's size, so both measurements use the same viewport.
  const renderProbe = (state) => {
    const hiddenSide = HIDDEN_SIDE_BY_COMPARE[state.compare];
    if (!hiddenSide) return;
    const visibleFrame = frames[hiddenSide === 'before' ? 'after' : 'before'].iframe;
    probeFrame.style.inlineSize = `${visibleFrame.offsetWidth}px`;
    probeFrame.style.blockSize = `${visibleFrame.offsetHeight}px`;
    setFrameSource(probeFrame, buildFrameUrl(FRAME_BASE_URL, hiddenSide, state, state.resetCount));
  };

  const render = (state) => {
    framesElement.dataset.compare = state.compare;
    framesElement.dataset.width = state.width === 'fit' ? 'fit' : 'fixed';
    framesElement.style.setProperty('--rs-frame-width', state.width === 'fit' ? '' : `${Number(state.width) + 2}px`);
    FRAME_SIDES.forEach((side) => {
      const isVisible = state.compare === 'side' || state.compare === side;
      frames[side].wrap.hidden = !isVisible;
      if (isVisible) setFrameSource(frames[side].iframe, buildFrameUrl(FRAME_BASE_URL, side, state, state.resetCount));
    });
    renderProbe(state);
  };


  return { render, scheduleDiff: session.schedule, getIframe: (side) => frames[side].iframe };
};
