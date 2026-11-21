import { useEffect, useMemo, useRef } from 'react';
import '../core/shell.css';
import { CHANGES_ACTIVE, COMPARISON_ENABLED } from '../core/constants.js';
import { pluralize, buildChangeSummary } from '../core/export-changes.js';
import { findState } from '../core/registry.js';
import { Inspector } from './components/Inspector';
import { Navigator } from './components/Navigator';
import { PreviewFrames } from './components/PreviewFrames';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { useDiffSession } from './hooks/use-diff-session';
import { useReviewState } from './hooks/use-review-state';
import { ReviewContext } from './review-context';
import type { Area, FrameRefs, Notes, PrototypeState, Reason } from './types';

interface ReviewShellProps {
  areas: Area[];
  states: PrototypeState[];
  notes: Notes;
  reasons: Reason[];
}

// Complete review shell. It matches the vanilla starter: same reducer, same measured diff, same markup and styles.
export const ReviewShell = ({ areas, states, notes, reasons }: ReviewShellProps) => {
  const [state, dispatch] = useReviewState(states);
  const frames = useRef<FrameRefs>({ before: null, after: null, probe: null });
  useDiffSession({ frames, state, dispatch, reasons });
  const contextValue = useMemo(() => ({ areas, states, notes, reasons, state, dispatch }), [areas, states, notes, reasons, state, dispatch]);

  // Escape leaves inspect mode.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isInspecting) dispatch({ type: 'set-inspecting', isInspecting: false });
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isInspecting]);

  // A preview may ask the shell to change state. Check origin, sender, type and registry id before acting.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const knownSenders = [frames.current.before?.contentWindow, frames.current.after?.contentWindow];
      const isTrusted = event.origin === location.origin && knownSenders.includes(event.source as Window);
      const target = isTrusted && event.data?.type === 'prototype:select-state' ? states.find((item) => item.id === event.data.id) : null;
      if (target) dispatch({ type: 'select-state', stateId: target.id, areaId: target.area });
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [states]);

  const current = findState(states, state.stateId);
  const selectedEntry = state.diff?.entries[state.selectedChange ?? -1];
  const announcement = selectedEntry ? `Change ${(state.selectedChange ?? 0) + 1} of ${state.diff?.entries.length}: ${selectedEntry.label}, ${pluralize(selectedEntry.changes.length, 'change')}.` : '';
  const reviewData = state.diff ? buildChangeSummary(current, state.diff) : { stateId: current.id, measured: false };

  return (
    <ReviewContext.Provider value={contextValue}>
      <div className="rs" id="rs-root" data-inspector={state.isInspectorOpen ? 'open' : 'closed'} data-sidebar={state.isSidebarOpen ? 'open' : 'closed'} data-changes={CHANGES_ACTIVE ? 'on' : 'off'} data-comparison={COMPARISON_ENABLED ? 'on' : 'off'}>
        <Sidebar />
        <main className="rs-main">
          <TopBar />
          <PreviewFrames frames={frames} />
          <Navigator />
        </main>
        <Inspector />
      </div>
      <div className="rs-sr" id="rs-live" role="status">{announcement}</div>
      <script type="application/json" id="rs-review-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewData) }} />
    </ReviewContext.Provider>
  );
};
