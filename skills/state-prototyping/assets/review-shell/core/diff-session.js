// Keeps the measured diff fresh while the reviewer works. It is framework-free: both starters create one session,
// register their preview iframes, and read the result through onResult.
import {
  DIFF_AFTER_INTERACTION_MS,
  DIFF_AFTER_RESIZE_MS,
  DIFF_DEBOUNCE_MS,
  DIFF_MIN_INTERVAL_MS,
  DIFF_READY_MAX_POLLS,
  DIFF_SETTLE_MAX_POLLS,
  DIFF_SETTLE_PAUSE_MS,
  DIFF_SETTLE_POLL_MS,
  OBSERVED_ATTRIBUTES,
} from './constants.js';
import { attachReasons, computeDiff } from './diff.js';

export const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// Entrance motion is still running. Endless animations (spinners) never settle, so they are ignored.
export const hasPendingMotion = (frameDocument) =>
  frameDocument.getAnimations().some((animation) => animation.playState === 'running' && animation.effect?.getComputedTiming().endTime !== Infinity);

const isFrameReady = (frame) => Boolean(frame?.contentDocument?.body) && frame.dataset.readyUrl === frame.getAttribute('src');

/**
 * @param {object} options
 * @param {() => ({ before: HTMLIFrameElement, after: HTMLIFrameElement } | null)} options.getMeasuredFrames
 *   The two frames to compare. Either visible frames or an off-screen probe for the side that is hidden.
 * @param {() => Array} options.getReasons
 * @param {() => boolean} [options.isEnabled] when false, nothing is measured
 * @param {() => void} options.onStart
 * @param {() => void} [options.onLayoutChange] a preview changed size, so outlines drawn from element positions must be redrawn
 * @param {(diff: object | null, errorMessage?: string) => void} options.onResult
 *   Called with the diff, or with null and a message when the previews could not be measured.
 */
export const createDiffSession = ({ getMeasuredFrames, getReasons, onStart, onResult, onLayoutChange = () => {}, isEnabled = () => true }) => {
  let timerId = 0;
  let runToken = 0;
  let lastRunAt = 0;
  const observersByFrame = new Map();
  const sizeObserversByFrame = new Map();

  const run = async () => {
    timerId = 0;
    if (!isEnabled()) return;
    runToken += 1;
    lastRunAt = Date.now();
    const token = runToken;
    onStart();
    const frames = getMeasuredFrames();
    if (!frames) return;
    const areReady = () => isFrameReady(frames.before) && isFrameReady(frames.after);
    for (let poll = 0; poll < DIFF_READY_MAX_POLLS && !areReady(); poll += 1) await wait(DIFF_SETTLE_POLL_MS);
    if (token !== runToken) return; // a newer measurement started
    if (!areReady()) {
      onResult(null, 'A preview did not load. Serve the folder over HTTP and check that both frame pages exist.');
      return;
    }
    const documents = [frames.before.contentDocument, frames.after.contentDocument];
    for (let poll = 0; poll < DIFF_SETTLE_MAX_POLLS && documents.some(hasPendingMotion); poll += 1) {
      await wait(DIFF_SETTLE_POLL_MS);
    }
    await wait(DIFF_SETTLE_PAUSE_MS);
    if (token !== runToken) return;
    try {
      onResult(attachReasons(computeDiff(documents[0], documents[1]), getReasons()));
    } catch (error) {
      onResult(null, `Could not measure the previews: ${error.message}`);
    }
  };

  // A newer request replaces a pending one: state, width and size changes are debounced.
  const schedule = (delayMs = DIFF_DEBOUNCE_MS) => {
    if (!isEnabled()) return;
    clearTimeout(timerId);
    timerId = setTimeout(run, delayMs);
  };

  // A busy preview (a ticking clock, an animation) can mutate constantly. The first request wins and later ones
  // wait for it, so the diff is measured at most twice a second instead of being pushed back forever.
  const scheduleAfterMutation = () => {
    if (!isEnabled() || timerId) return;
    const sinceLastRun = Date.now() - lastRunAt;
    timerId = setTimeout(run, Math.max(DIFF_AFTER_INTERACTION_MS, DIFF_MIN_INTERVAL_MS - sinceLastRun));
  };

  // When the reviewer uses a preview, its DOM changes and the diff is measured again.
  const observe = (frame) => {
    observersByFrame.get(frame)?.disconnect();
    const observer = new MutationObserver(scheduleAfterMutation);
    observer.observe(frame.contentDocument.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTES,
    });
    observersByFrame.set(frame, observer);
  };

  // A preview that changes size re-flows its content (and may switch media queries), so outlines move and the diff is re-measured.
  const observeSize = (frame) => {
    const sizeObserver = new ResizeObserver(() => {
      onLayoutChange();
      schedule(DIFF_AFTER_RESIZE_MS);
    });
    sizeObserver.observe(frame);
    sizeObserversByFrame.set(frame, sizeObserver);
  };

  /**
   * @param {HTMLIFrameElement} frame
   * @param {{ isProbe?: boolean }} [options] The off-screen probe is only measured: its size is set from the visible
   *   frame and its content is frozen, so it neither watches mutations nor resizes.
   */
  const attachFrame = (frame, { isProbe = false } = {}) => {
    const handleLoad = () => {
      frame.dataset.readyUrl = frame.getAttribute('src');
      if (!isProbe) observe(frame);
      schedule();
    };
    frame.addEventListener('load', handleLoad);
    if (!isProbe) observeSize(frame);
    return () => {
      frame.removeEventListener('load', handleLoad);
      observersByFrame.get(frame)?.disconnect();
      observersByFrame.delete(frame);
      sizeObserversByFrame.get(frame)?.disconnect();
      sizeObserversByFrame.delete(frame);
    };
  };

  const dispose = () => {
    clearTimeout(timerId);
    timerId = 0;
    runToken += 1;
    observersByFrame.forEach((observer) => observer.disconnect());
    observersByFrame.clear();
    sizeObserversByFrame.forEach((observer) => observer.disconnect());
    sizeObserversByFrame.clear();
  };

  return { attachFrame, schedule, dispose };
};
