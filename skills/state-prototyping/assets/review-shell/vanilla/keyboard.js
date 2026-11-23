// Page-wide keys. Escape closes one layer at a time (popover, inspect mode, overlay sidebar, inspector).
// `[` and `]` step through the changes unless the reviewer is typing.
import { CHANGES_ACTIVE, SIDEBAR_OVERLAY_QUERY } from '../core/constants.js';
import { isTypingTarget } from './dom.js';

export const createKeyboard = ({ dispatch, getState, popovers }) => {
  const closeTopLayer = () => {
    const state = getState();
    if (state.popover) {
      const button = popovers.getButton(state.popover);
      dispatch({ type: 'set-popover', popover: null });
      button?.focus();
    } else if (state.isInspecting) {
      dispatch({ type: 'set-inspecting', isInspecting: false });
    } else if (state.isSidebarOpen && matchMedia(SIDEBAR_OVERLAY_QUERY).matches) {
      dispatch({ type: 'set-sidebar', isOpen: false, isUserChoice: false });
      document.getElementById('rs-toggle-sidebar').focus();
    } else if (state.isInspectorOpen) {
      dispatch({ type: 'set-inspector', isOpen: false });
      document.getElementById('rs-changes').focus();
    }
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeTopLayer();
    if (CHANGES_ACTIVE && !isTypingTarget(event.target) && !event.metaKey && !event.ctrlKey && !event.altKey && (event.key === '[' || event.key === ']')) {
      dispatch({ type: 'step-change', offset: event.key === ']' ? 1 : -1 });
    }
  });

  // A popover is not modal: an outside click, or focus moving into a preview, closes it.
  const closePopoverOutside = (target) => {
    const state = getState();
    if (!state.popover) return;
    if (target?.closest?.('.rs-pop, #rs-details, #rs-share, #rs-legend-button')) return;
    dispatch({ type: 'set-popover', popover: null });
  };
  document.addEventListener('pointerdown', (event) => closePopoverOutside(event.target));
  window.addEventListener('blur', () => closePopoverOutside(null));
};
