// Page-wide input: Escape closes one layer at a time (popover, inspect mode, overlay sidebar, inspector), `[` and `]`
// step through the changes unless the reviewer is typing, an outside click closes a popover, and a preview may ask
// the shell to change state.
import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { CHANGES_ACTIVE, SIDEBAR_OVERLAY_QUERY } from '../../core/constants.js';
import type { ReviewStore } from '../review-store';
import type { FrameRefs, PopoverName, PrototypeState } from '../types';

const POPOVER_BUTTON_IDS: Partial<Record<PopoverName, string>> = { details: 'rs-details', share: 'rs-share', legend: 'rs-legend-button' };
const POPOVER_OWNER_SELECTOR = '.rs-pop, #rs-details, #rs-share, #rs-legend-button';

// True when focus is somewhere the reviewer is typing, so single-key shortcuts stay out of the way.
const isTypingTarget = (target: EventTarget | null) => Boolean((target as Element | null)?.closest?.('input, textarea, select, [contenteditable="true"]'));

export const usePageEvents = (store: ReviewStore, states: PrototypeState[], frames: MutableRefObject<FrameRefs>) => {
  useEffect(() => {
    const focusById = (id: string | undefined) => (id ? document.getElementById(id)?.focus() : undefined);

    const closeTopLayer = () => {
      const state = store.getState();
      if (state.popover) {
        store.dispatch({ type: 'set-popover', popover: null });
        focusById(POPOVER_BUTTON_IDS[state.popover]);
      } else if (state.isInspecting) {
        store.dispatch({ type: 'set-inspecting', isInspecting: false });
      } else if (state.isSidebarOpen && matchMedia(SIDEBAR_OVERLAY_QUERY).matches) {
        store.dispatch({ type: 'set-sidebar', isOpen: false, isUserChoice: false });
        focusById('rs-toggle-sidebar');
      } else if (state.isInspectorOpen) {
        store.dispatch({ type: 'set-inspector', isOpen: false });
        focusById('rs-changes');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTopLayer();
      if (CHANGES_ACTIVE && !isTypingTarget(event.target) && !event.metaKey && !event.ctrlKey && !event.altKey && (event.key === '[' || event.key === ']')) {
        store.dispatch({ type: 'step-change', offset: event.key === ']' ? 1 : -1 });
      }
    };

    // A popover is not modal: an outside click, or focus moving into a preview, closes it.
    const closePopoverOutside = (target: EventTarget | null) => {
      if (!store.getState().popover) return;
      if ((target as Element | null)?.closest?.(POPOVER_OWNER_SELECTOR)) return;
      store.dispatch({ type: 'set-popover', popover: null });
    };
    const handlePointerDown = (event: PointerEvent) => closePopoverOutside(event.target);
    const handleBlur = () => closePopoverOutside(null);

    // A preview may ask the shell to change state. Check origin, sender, type and registry id before acting.
    const handleMessage = (event: MessageEvent) => {
      const knownSenders = [frames.current.before?.contentWindow, frames.current.after?.contentWindow];
      const isTrusted = event.origin === location.origin && knownSenders.includes(event.source as Window);
      const target = isTrusted && event.data?.type === 'prototype:select-state' ? states.find((item) => item.id === event.data.id) : null;
      if (target) store.dispatch({ type: 'select-state', stateId: target.id, areaId: target.area });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('message', handleMessage);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('message', handleMessage);
    };
  }, [store, states, frames]);
};
