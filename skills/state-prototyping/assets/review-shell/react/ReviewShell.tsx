import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import '../core/shell.css';
import { CHANGES_ACTIVE, COMPARISON_ENABLED } from '../core/constants.js';
import { orderStatesByArea } from '../core/registry.js';
import { readViewFromSearch } from '../core/view-state.js';
import { Inspector } from './components/Inspector';
import { LiveRegion } from './components/LiveRegion';
import { PreviewFrames } from './components/PreviewFrames';
import { ReviewData } from './components/ReviewData';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { usePageEvents } from './hooks/use-page-events';
import { useUrlSync } from './hooks/use-url-sync';
import { ReviewContext, useReviewPart } from './review-context';
import { createReviewStore } from './review-store';
import type { Area, FrameRefs, Notes, PrototypeState, Reason } from './types';

interface ReviewShellProps {
  areas: Area[];
  states: PrototypeState[];
  notes: Notes;
  reasons: Reason[];
}

// The root element carries the layout flags. Its children are created once, so a change here does not re-render them.
const ShellRoot = ({ children }: { children: ReactNode }) => {
  const state = useReviewPart('toolbar');
  const rootRef = useRef<HTMLDivElement>(null);

  // Transitions are scoped to [data-ready], so nothing animates on the first paint.
  useEffect(() => {
    const frameId = requestAnimationFrame(() => { if (rootRef.current) rootRef.current.dataset.ready = ''; });
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className="rs"
      id="rs-root"
      ref={rootRef}
      data-sidebar={state.isSidebarOpen ? 'open' : 'closed'}
      data-inspector={CHANGES_ACTIVE && state.isInspectorOpen ? 'open' : 'closed'}
      data-changes={CHANGES_ACTIVE ? 'on' : 'off'}
      data-comparison={COMPARISON_ENABLED ? 'on' : 'off'}
    >
      {children}
    </div>
  );
};

const ReviewShellContent = ({ areas, states, notes, reasons }: ReviewShellProps) => {
  const [store] = useState(() => createReviewStore(readViewFromSearch(location.search, states, window.innerWidth)));
  const frames = useRef<FrameRefs>({ before: null, after: null, probe: null });
  const contextValue = useMemo(() => ({ areas, states, notes, reasons, store }), [areas, states, notes, reasons, store]);
  useUrlSync(store);
  usePageEvents(store, states, frames);

  return (
    <ReviewContext.Provider value={contextValue}>
      <ShellRoot>
        <Sidebar />
        <main className="rs-main">
          <Toolbar />
          <PreviewFrames frames={frames} />
        </main>
        <Inspector />
      </ShellRoot>
      <LiveRegion />
      <ReviewData />
    </ReviewContext.Provider>
  );
};

// Complete review shell. It matches the vanilla starter: same reducer, same measured diff, same markup and styles.
export const ReviewShell = (props: ReviewShellProps) => {
  const states = useMemo(() => orderStatesByArea(props.areas, props.states), [props.areas, props.states]);
  return states.length
    ? <ReviewShellContent {...props} states={states} />
    : <p>states.js has no states yet. Add the first one, then reload.</p>;
};
