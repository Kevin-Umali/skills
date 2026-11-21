// Keeps the measured diff fresh while the reviewer works. It is framework-free: both starters create one session,
// register their preview iframes, and read the result through onResult.
import {
  DIFF_AFTER_INTERACTION_MS,
  DIFF_AFTER_RESIZE_MS,
  DIFF_DEBOUNCE_MS,
  DIFF_SETTLE_MAX_POLLS,
  DIFF_SETTLE_PAUSE_MS,
  DIFF_SETTLE_POLL_MS,
} from './constants.js';
import { attachReasons, computeDiff } from './diff.js';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// Entrance motion is still running. Endless animations (spinners) never settle, so they are ignored.
const hasPendingMotion = (frameDocument) =>
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
 * @param {(diff: object | null) => void} options.onResult
 */
export const createDiffSession = ({ getMeasuredFrames, getReasons, onStart, onResult, onLayoutChange = () => {}, isEnabled = () => true }) => {
  let timerId;
  let runToken = 0;
  const observersByFrame = new Map();
  const sizeObserversByFrame = new Map();

  const run = async () => {
    runToken += 1;
    const token = runToken;
    onStart();
    const frames = getMeasuredFrames();
    if (!frames || !isFrameReady(frames.before) || !isFrameReady(frames.after)) return;
    const documents = [frames.before.contentDocument, frames.after.contentDocument];
    for (let poll = 0; poll < DIFF_SETTLE_MAX_POLLS && documents.some(hasPendingMotion); poll += 1) {
      await wait(DIFF_SETTLE_POLL_MS);
    }
    await wait(DIFF_SETTLE_PAUSE_MS);
    if (token !== runToken) return; // a newer measurement started
    onResult(attachReasons(computeDiff(documents[0], documents[1]), getReasons()));
  };

  const schedule = (delayMs = DIFF_DEBOUNCE_MS) => {
    if (!isEnabled()) return;
    clearTimeout(timerId);
    timerId = setTimeout(run, delayMs);
  };

  // When the reviewer uses a preview, its DOM changes and the diff is measured again.
  const observe = (frame) => {
    observersByFrame.get(frame)?.disconnect();
    const observer = new MutationObserver(() => schedule(DIFF_AFTER_INTERACTION_MS));
    observer.observe(frame.contentDocument.body, { subtree: true, childList: true, attributes: true, characterData: true });
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

  const attachFrame = (frame) => {
    const handleLoad = () => {
      frame.dataset.readyUrl = frame.getAttribute('src');
      observe(frame);
      schedule();
    };
    frame.addEventListener('load', handleLoad);
    observeSize(frame);
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
    runToken += 1;
    observersByFrame.forEach((observer) => observer.disconnect());
    observersByFrame.clear();
    sizeObserversByFrame.forEach((observer) => observer.disconnect());
    sizeObserversByFrame.clear();
  };

  return { attachFrame, schedule, dispose };
};
