import { useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { CHANGES_ACTIVE, COMPARISON_ENABLED } from '../../core/constants.js';
import { MEASURE_TRIGGER_ACTIONS } from '../../core/render-scopes.js';
import { createDiffSession } from '../../core/diff-session.js';
import { createScrollSync } from '../../core/scroll-sync.js';
import type { ReviewStore } from '../review-store';
import type { CompareMode, FrameRefs, Reason } from '../types';

// The side that only the off-screen probe renders, per compare mode.
export const HIDDEN_SIDE_BY_COMPARE: Partial<Record<CompareMode, 'before' | 'after'>> = { after: 'before', before: 'after' };

// The probe renders the hidden side at the visible frame's size, so both measurements use the same viewport.
export const syncProbeSize = (frames: FrameRefs, compare: CompareMode) => {
  const hiddenSide = HIDDEN_SIDE_BY_COMPARE[compare];
  if (!frames.probe || !hiddenSide) return;
  const visibleFrame = frames[hiddenSide === 'before' ? 'after' : 'before'];
  if (!visibleFrame) return;
  frames.probe.style.inlineSize = `${visibleFrame.offsetWidth}px`;
  frames.probe.style.blockSize = `${visibleFrame.offsetHeight}px`;
};

interface UsePreviewSessionOptions {
  store: ReviewStore;
  frames: MutableRefObject<FrameRefs>;
  reasons: Reason[];
  onFrameLoad: () => void;
}

// Watches the preview frames: the measured diff (only with change tracking), Slider scroll sync, and layout changes that
// move the outlines. With change tracking off there is no session, probe or diff scroll listener at all.
export const usePreviewSession = ({ store, frames, reasons, onFrameLoad }: UsePreviewSessionOptions) => {
  const onFrameLoadRef = useRef(onFrameLoad);
  onFrameLoadRef.current = onFrameLoad;
  const reasonsRef = useRef(reasons);
  reasonsRef.current = reasons;

  // A layout effect, so the load listeners exist before the frame sources are set.
  useLayoutEffect(() => {
    const { before, after, probe } = frames.current;
    if (!before || !after) return undefined;
    const cleanups: Array<() => void> = [];

    const getMeasuredFrames = () => {
      const { compare } = store.getState();
      const current = frames.current;
      if (!current.probe || !current.before || !current.after) return null;
      if (compare === 'after') return { before: current.probe, after: current.after };
      if (compare === 'before') return { before: current.before, after: current.probe };
      return { before: current.before, after: current.after };
    };
    const session = CHANGES_ACTIVE
      ? createDiffSession({
        getMeasuredFrames,
        getReasons: () => reasonsRef.current,
        onStart: () => store.dispatch({ type: 'measuring' }),
        onResult: (diff: unknown, message?: string) => store.dispatch(message ? { type: 'diff-failed', message } : { type: 'diff-ready', diff }),
        onLayoutChange: () => {
          syncProbeSize(frames.current, store.getState().compare);
          store.notifyLayoutChange();
        },
      })
      : null;
    // In Slider mode the two documents scroll together.
    const syncScroll = COMPARISON_ENABLED
      ? createScrollSync({ getFrames: () => [before, after], isActive: () => store.getState().compare === 'slider' })
      : null;

    const watchFrame = (frame: HTMLIFrameElement, isProbe: boolean) => {
      const detachSession = session?.attachFrame(frame, { isProbe });
      if (detachSession) cleanups.push(detachSession);
      if (isProbe || !(COMPARISON_ENABLED || CHANGES_ACTIVE)) return;
      let scrolledWindow: Window | null = null;
      const handleScroll = () => {
        syncScroll?.(frame);
        if (CHANGES_ACTIVE) store.notifyLayoutChange();
      };
      const handleLoad = () => {
        scrolledWindow?.removeEventListener('scroll', handleScroll);
        scrolledWindow = frame.contentWindow;
        scrolledWindow?.addEventListener('scroll', handleScroll);
        onFrameLoadRef.current();
      };
      frame.addEventListener('load', handleLoad);
      cleanups.push(() => {
        frame.removeEventListener('load', handleLoad);
        scrolledWindow?.removeEventListener('scroll', handleScroll);
      });
    };
    watchFrame(before, false);
    watchFrame(after, false);
    if (probe && session) watchFrame(probe, true);

    cleanups.push(store.onAction((_state, action) => {
      if (MEASURE_TRIGGER_ACTIONS.has(action.type)) session?.schedule();
    }));
    session?.schedule();
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      session?.dispose();
    };
  }, [store, frames]);
};
