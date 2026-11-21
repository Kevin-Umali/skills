import { useEffect, useRef } from 'react';
import { findState, getAdjacentState, getAreaLabel } from '../../core/registry.js';
import { useReview } from '../review-context';

const POPOVER_TITLES = { details: 'Fixture details', 'copy-link': 'Copy link' };

// Floating navigator at the bottom centre: Previous, the selected state (opens its fixture details), Next.
export const Navigator = () => {
  const { areas, states, state, dispatch } = useReview();
  const current = findState(states, state.stateId);
  const label = `${getAreaLabel(areas, current.area)}: ${current.label}`;
  const detailsButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const copyFieldRef = useRef<HTMLInputElement>(null);
  const previousState = getAdjacentState(states, current.id, -1);
  const nextState = getAdjacentState(states, current.id, 1);

  useEffect(() => {
    if (state.popover === 'copy-link') copyFieldRef.current?.select();
  }, [state.popover]);

  // The popover is not modal: Escape, an outside click, or focus moving into a preview closes it.
  useEffect(() => {
    if (!state.popover) return undefined;
    const close = (restoreFocus = false) => {
      dispatch({ type: 'set-popover', popover: null });
      if (restoreFocus) detailsButtonRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!popoverRef.current?.contains(target) && !target.closest('#rs-details, #rs-copy-link')) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(true); };
    const handleBlur = () => close();
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [state.popover]);

  const selectState = (target: typeof current | null) => {
    if (target) dispatch({ type: 'select-state', stateId: target.id, areaId: target.area });
  };

  return (
    <div className="rs-navigator">
      <div className="rs-nav-pill">
        <button type="button" className="rs-btn" disabled={!previousState} onClick={() => selectState(previousState)}>Previous</button>
        <button
          type="button"
          className="rs-btn rs-nav-title"
          id="rs-details"
          ref={detailsButtonRef}
          title={current.description}
          aria-label={`Fixture details for ${label}`}
          aria-expanded={state.popover === 'details'}
          aria-controls="rs-popover"
          onClick={() => dispatch({ type: 'set-popover', popover: state.popover === 'details' ? null : 'details' })}
        >
          <strong>{label}</strong>
          <span>{states.indexOf(current) + 1} of {states.length}</span>
        </button>
        <button type="button" className="rs-btn" disabled={!nextState} onClick={() => selectState(nextState)}>Next</button>
        <div className="rs-pop" id="rs-popover" ref={popoverRef} role="region" aria-label={state.popover ? POPOVER_TITLES[state.popover] : 'Fixture details'} hidden={!state.popover}>
          {state.popover === 'details' && (
            <dl>
              {([['Description', current.description], ['ID', current.id], ['Source owner', current.owner], ['Boundary', current.boundary], ['Limits', current.limits]] as const).map(([term, description]) => (
                <div key={term} style={{ display: 'contents' }}><dt>{term}</dt><dd>{description}</dd></div>
              ))}
            </dl>
          )}
          {state.popover === 'copy-link' && (
            <>
              <p>Could not copy automatically. Copy the link from here:</p>
              <input ref={copyFieldRef} readOnly aria-label="Review link" value={location.href} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
