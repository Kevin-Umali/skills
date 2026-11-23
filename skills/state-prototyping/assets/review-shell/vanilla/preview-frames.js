// The stage: Before and After previews, the slider, inline notices, and an off-screen probe so the diff also works
// when only one side is shown. With change tracking off there is no probe, no observer and no scroll listener for the diff.
import { CHANGES_ACTIVE, COMPARISON_ENABLED, FRAME_BASE_URL, FRAME_SIDES, HEIGHT_CHECK_DELAY_MS } from '../core/constants.js';
import { createDiffSession } from '../core/diff-session.js';
import { createScrollSync } from '../core/scroll-sync.js';
import { buildStageNotices, hasHeightMismatch } from '../core/stage-notices.js';
import { buildFrameUrl } from '../core/view-state.js';
import { byId, createButton, createChangeDetector, createElement } from './dom.js';
import { createSliderHandle } from './slider-handle.js';

const HIDDEN_SIDE_BY_COMPARE = { after: 'before', before: 'after' };

export const createPreviewFrames = ({ dispatch, getState, getReasons, onLayoutChange }) => {
  const framesElement = byId('rs-frames');
  const noticesElement = byId('rs-notices');
  const frames = Object.fromEntries(FRAME_SIDES.map((side) => [side, { wrap: byId(`rs-wrap-${side}`), iframe: byId(`rs-frame-${side}`) }]));
  const probeFrame = CHANGES_ACTIVE ? createElement('iframe', { className: 'rs-probe', attributes: { title: 'Off-screen measurement', 'aria-hidden': 'true', tabindex: '-1' } }) : null;
  if (probeFrame) byId('rs-stage').append(probeFrame);
  const sliderHandle = createSliderHandle({ boundsElement: framesElement, dispatch, getState });
  const hasChanged = createChangeDetector();
  let heightsDiffer = false;
  let measuredFrameWidth = 0;
  let heightTimerId;

  const getMeasuredFrames = () => {
    const { compare } = getState();
    if (compare === 'after') return { before: probeFrame, after: frames.after.iframe };
    if (compare === 'before') return { before: frames.before.iframe, after: probeFrame };
    return { before: frames.before.iframe, after: frames.after.iframe };
  };

  // The probe renders the hidden side at the visible frame's size, so both measurements use the same viewport.
  const syncProbeSize = () => {
    const hiddenSide = HIDDEN_SIDE_BY_COMPARE[getState().compare];
    if (!probeFrame || !hiddenSide) return;
    const visibleFrame = frames[hiddenSide === 'before' ? 'after' : 'before'].iframe;
    probeFrame.style.inlineSize = `${visibleFrame.offsetWidth}px`;
    probeFrame.style.blockSize = `${visibleFrame.offsetHeight}px`;
  };

  const session = CHANGES_ACTIVE
    ? createDiffSession({
      getMeasuredFrames,
      getReasons,
      onStart: () => dispatch({ type: 'measuring' }),
      onResult: (diff, message) => dispatch(message ? { type: 'diff-failed', message } : { type: 'diff-ready', diff }),
      onLayoutChange: () => {
        syncProbeSize();
        onLayoutChange();
      },
    })
    : null;

  // In Slider mode the two documents scroll together.
  const syncScroll = COMPARISON_ENABLED
    ? createScrollSync({ getFrames: () => [frames.before.iframe, frames.after.iframe], isActive: () => getState().compare === 'slider' })
    : null;

  const renderNotices = () => {
    const state = getState();
    const notices = COMPARISON_ENABLED ? buildStageNotices({ compare: state.compare, width: state.width, frameWidth: measuredFrameWidth, heightsDiffer }) : [];
    noticesElement.replaceChildren(...notices.map((notice) => {
      const button = createButton(notice.actionLabel);
      button.addEventListener('click', () => dispatch(notice.action));
      return createElement('div', { className: 'rs-notice', attributes: { role: 'status' }, dataset: { notice: notice.id } }, [createElement('span', { text: notice.message }), button]);
    }));
  };

  const checkHeights = () => {
    clearTimeout(heightTimerId);
    heightTimerId = setTimeout(() => {
      const [beforeHeight, afterHeight] = FRAME_SIDES.map((side) => frames[side].iframe.contentDocument?.documentElement.scrollHeight ?? 0);
      const nextHeightsDiffer = Boolean(beforeHeight && afterHeight) && hasHeightMismatch(beforeHeight, afterHeight);
      if (nextHeightsDiffer !== heightsDiffer) {
        heightsDiffer = nextHeightsDiffer;
        renderNotices();
      }
    }, HEIGHT_CHECK_DELAY_MS);
  };

  const watchFrame = (frame, { isProbe }) => {
    session?.attachFrame(frame, { isProbe });
    if (isProbe) return;
    frame.addEventListener('load', () => {
      frame.contentWindow.addEventListener('scroll', () => {
        syncScroll?.(frame);
        if (CHANGES_ACTIVE) onLayoutChange();
      });
      if (COMPARISON_ENABLED) checkHeights();
    });
  };
  FRAME_SIDES.forEach((side) => watchFrame(frames[side].iframe, { isProbe: false }));
  if (probeFrame) watchFrame(probeFrame, { isProbe: true });

  // The narrow-frame notice needs the real width of a frame, so it follows the frames' size.
  if (COMPARISON_ENABLED) {
    new ResizeObserver(() => {
      const nextWidth = Math.round(frames.before.wrap.getBoundingClientRect().width);
      if (getState().compare !== 'split' || nextWidth === measuredFrameWidth) return;
      measuredFrameWidth = nextWidth;
      renderNotices();
    }).observe(framesElement);
  }

  const setFrameSource = (iframe, url) => {
    if (iframe.getAttribute('src') !== url) iframe.src = url;
  };

  const renderProbe = (state) => {
    const hiddenSide = HIDDEN_SIDE_BY_COMPARE[state.compare];
    if (!probeFrame || !hiddenSide) return;
    syncProbeSize();
    setFrameSource(probeFrame, buildFrameUrl(FRAME_BASE_URL, hiddenSide, state, state.resetCount));
  };

  if (!COMPARISON_ENABLED) {
    byId('rs-after-name').textContent = 'Preview';
    byId('rs-after-hint').hidden = true;
  }

  const render = (state) => {
    framesElement.style.setProperty('--rs-split', `${state.split}%`);
    sliderHandle.render(state);
    if (!hasChanged(state.compare, state.width, state.theme, state.stateId, state.resetCount)) return;
    framesElement.dataset.compare = state.compare;
    framesElement.dataset.width = state.width === 'fit' ? 'fit' : 'fixed';
    framesElement.style.setProperty('--rs-frame-width', state.width === 'fit' ? '' : `${Number(state.width) + 2}px`);
    FRAME_SIDES.forEach((side) => {
      const isVisible = state.compare === 'split' || state.compare === 'slider' || state.compare === side;
      frames[side].wrap.hidden = !isVisible;
      if (isVisible) setFrameSource(frames[side].iframe, buildFrameUrl(FRAME_BASE_URL, side, state, state.resetCount));
    });
    renderProbe(state);
    if (state.compare !== 'split') measuredFrameWidth = 0;
    else measuredFrameWidth = Math.round(frames.before.wrap.getBoundingClientRect().width);
    if (state.compare !== 'slider') heightsDiffer = false;
    else checkHeights();
    renderNotices();
  };

  return { render, scheduleDiff: session ? session.schedule : () => {}, getIframe: (side) => frames[side].iframe };
};
