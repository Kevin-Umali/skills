import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { COPY_NOTICE_MS } from '../../core/constants.js';
import { buildChangeSummary, formatChangesAsJson, formatChangesAsMarkdown } from '../../core/export-changes.js';
import { findState } from '../../core/registry.js';
import type { ReviewStore } from '../review-store';
import type { PrototypeState } from '../types';

const SHARE_RESULTS = { done: 'Copied', failed: 'Copy failed' } as const;
const SHARE_LABEL = 'Share';

// The Share menu's actions. A copy result shows on the Share button itself for a moment (no toast over the previews).
export const useShareActions = (store: ReviewStore, states: PrototypeState[], shareButtonRef: RefObject<HTMLButtonElement>) => {
  const [result, setResult] = useState<keyof typeof SHARE_RESULTS | null>(null);
  const timerId = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timerId.current), []);

  const showResult = (nextResult: keyof typeof SHARE_RESULTS) => {
    setResult(nextResult);
    store.announce(SHARE_RESULTS[nextResult]);
    clearTimeout(timerId.current);
    timerId.current = setTimeout(() => setResult(null), COPY_NOTICE_MS);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      store.dispatch({ type: 'set-popover', popover: null });
      shareButtonRef.current?.focus();
      showResult('done');
    } catch {
      return false;
    }
    return true;
  };

  const handleShareAction = async (action: string) => {
    const state = store.getState();
    if (action === 'copy-link') {
      if (!(await copyText(location.href))) store.dispatch({ type: 'set-popover', popover: 'copy-link' });
      return;
    }
    const summary = state.diff ? buildChangeSummary(findState(states, state.stateId), state.diff) : null;
    if (!summary) {
      store.dispatch({ type: 'set-popover', popover: null });
      showResult('failed');
      return;
    }
    const text = action === 'copy-json' ? formatChangesAsJson(summary) : formatChangesAsMarkdown(summary);
    if (!(await copyText(text))) showResult('failed');
  };

  return { shareLabel: result ? SHARE_RESULTS[result] : SHARE_LABEL, handleShareAction };
};
