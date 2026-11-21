import { useEffect, useRef, useState } from 'react';
import { CHANGES_ACTIVE } from '../../core/constants.js';
import { createDiffSession } from '../../core/diff-session.js';
import type { FrameRefs, Reason, ReviewAction, ReviewState } from '../types';
import type { Dispatch, MutableRefObject } from 'react';

interface UseDiffSessionOptions {
  frames: MutableRefObject<FrameRefs>;
  state: ReviewState;
  dispatch: Dispatch<ReviewAction>;
  reasons: Reason[];
}

// Measures Before against After while the reviewer works. Returns a counter that changes when a preview scrolls or
// resizes, so outlines drawn from element positions redraw in the right place.
export const useDiffSession = ({ frames, state, dispatch, reasons }: UseDiffSessionOptions) => {
  const latestState = useRef(state);
  latestState.current = state;
  const [layoutTick, setLayoutTick] = useState(0);
  const sessionRef = useRef<ReturnType<typeof createDiffSession> | null>(null);

  useEffect(() => {
    const getMeasuredFrames = () => {
      const { before, after, probe } = frames.current;
      const { compare } = latestState.current;
      if (!before || !after || !probe) return null;
      if (compare === 'side') return { before, after };
      return compare === 'after' ? { before: probe, after } : { before, after: probe };
    };
    const session = createDiffSession({
      getMeasuredFrames,
      getReasons: () => reasons,
      onStart: () => dispatch({ type: 'measuring' }),
      onResult: (diff: unknown, message?: string) => dispatch(message ? { type: 'diff-failed', message } : { type: 'diff-ready', diff }),
      onLayoutChange: () => setLayoutTick((tick) => tick + 1),
      isEnabled: () => CHANGES_ACTIVE,
    });
    sessionRef.current = session;
    const detachers = (['before', 'after', 'probe'] as const).flatMap((name) => {
      const frame = frames.current[name];
      if (!frame) return [];
      const handleScroll = () => setLayoutTick((tick) => tick + 1);
      const handleLoad = () => frame.contentWindow?.addEventListener('scroll', handleScroll);
      frame.addEventListener('load', handleLoad);
      return [session.attachFrame(frame), () => frame.removeEventListener('load', handleLoad)];
    });
    session.schedule();
    return () => {
      detachers.forEach((detach) => detach());
      session.dispose();
    };
  }, []);

  // These changes alter what the previews render, so the diff is measured again.
  useEffect(() => {
    sessionRef.current?.schedule();
  }, [state.stateId, state.theme, state.width, state.compare, state.resetCount]);

  return layoutTick;
};
