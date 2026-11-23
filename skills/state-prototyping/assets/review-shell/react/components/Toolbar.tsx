// The one-row toolbar: sidebar toggle, breadcrumb with Previous and Next, Compare and Width, preview theme,
// the Changes toggle and the Share menu. It also owns the popovers that hang off it.
import { useRef } from 'react';
import { buildIconSvg } from '../../core/icons.js';
import { getNextTheme, getOptionLabel } from '../../core/controls.js';
import { findState, getAdjacentState, getAreaLabel } from '../../core/registry.js';
import { useShareActions } from '../hooks/use-share-actions';
import { useReview, useReviewPart } from '../review-context';
import { ChoiceControl } from './ChoiceControl';
import { Icon } from './Icon';
import { CopyLinkPopover, DetailsPopover, ShareMenu } from './Popovers';

export const Toolbar = () => {
  const { areas, states, store } = useReview();
  const state = useReviewPart('toolbar');
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const { shareLabel, handleShareAction } = useShareActions(store, states, shareButtonRef);
  const { dispatch } = store;

  const current = findState(states, state.stateId);
  const areaLabel = getAreaLabel(areas, current.area);
  const previousState = getAdjacentState(states, current.id, -1);
  const nextState = getAdjacentState(states, current.id, 1);
  const sidebarLabel = state.isSidebarOpen ? 'Hide sidebar' : 'Show sidebar';
  const changeCount = state.diff?.entries.length ?? 0;

  const selectState = (target: typeof previousState) => {
    if (target) dispatch({ type: 'select-state', stateId: target.id, areaId: target.area });
  };
  const togglePopover = (popover: 'details' | 'share') => dispatch({ type: 'set-popover', popover: store.getState().popover === popover ? null : popover });

  return (
    <header className="rs-toolbar" id="rs-toolbar" data-region="toolbar" aria-label="Review controls">
      <div className="rs-tb-group rs-tb-start">
        <button type="button" className="rs-icon-btn" id="rs-toggle-sidebar" data-control="sidebar" aria-controls="rs-side" aria-expanded={state.isSidebarOpen} aria-label={sidebarLabel} title={sidebarLabel} onClick={() => dispatch({ type: 'set-sidebar', isOpen: !store.getState().isSidebarOpen, isUserChoice: true })}><Icon name="sidebar" /></button>
        <div className="rs-crumb-wrap">
          <button type="button" className="rs-crumb" id="rs-details" aria-expanded={state.popover === 'details'} aria-controls="rs-details-pop" aria-label={`Fixture details for ${areaLabel}: ${current.label}`} title={current.description} onClick={() => togglePopover('details')}>
            <span className="rs-crumb-text"><span className="rs-mute" id="rs-crumb-area">{areaLabel}</span> / <span id="rs-crumb-state">{current.label}</span></span>
          </button>
          <DetailsPopover isOpen={state.popover === 'details'} current={current} />
        </div>
        <span className="rs-meta" id="rs-position">{`${states.indexOf(current) + 1} of ${states.length}`}</span>
        <button type="button" className="rs-icon-btn" id="rs-previous" aria-label="Previous state" disabled={!previousState} onClick={() => selectState(previousState)}><Icon name="previous" /></button>
        <button type="button" className="rs-icon-btn" id="rs-next" aria-label="Next state" disabled={!nextState} onClick={() => selectState(nextState)}><Icon name="next" /></button>
      </div>
      <div className="rs-tb-group rs-tb-view" id="rs-view-controls">
        <ChoiceControl controlId="compare" value={state.compare} extraClassName="rs-compare" />
        <ChoiceControl controlId="width" value={state.width} extraClassName="rs-width" />
      </div>
      <div className="rs-tb-group rs-tb-end">
        <button
          type="button"
          className="rs-icon-btn"
          id="rs-theme"
          data-control="theme"
          aria-label={`Preview theme: ${getOptionLabel('theme', state.theme).toLowerCase()}`}
          title="Preview theme. Click to switch."
          onClick={() => dispatch({ type: 'set-view', key: 'theme', value: getNextTheme(store.getState().theme) })}
          dangerouslySetInnerHTML={{ __html: buildIconSvg(state.theme === 'dark' ? 'moon' : 'sun') }}
        />
        <button type="button" className="rs-btn" id="rs-changes" data-control="changes" data-feature="changes" aria-controls="rs-inspector" aria-pressed={state.isInspectorOpen} aria-label={changeCount ? `Changes, ${changeCount}` : 'Changes'} onClick={() => dispatch({ type: 'set-inspector', isOpen: !store.getState().isInspectorOpen })}>
          <Icon name="changes" /><span className="rs-btn-label">Changes</span><span className="rs-count-badge" id="rs-changes-count">{changeCount ? String(changeCount) : ''}</span>
        </button>
        <div className="rs-menu-wrap">
          <button type="button" className="rs-btn" id="rs-share" data-control="share" aria-haspopup="menu" aria-expanded={state.popover === 'share'} aria-controls="rs-share-menu" aria-label={shareLabel} ref={shareButtonRef} onClick={() => togglePopover('share')}>
            <Icon name="share" /><span className="rs-btn-label" id="rs-share-label">{shareLabel}</span>
          </button>
          <ShareMenu isOpen={state.popover === 'share'} onAction={handleShareAction} />
          <CopyLinkPopover isOpen={state.popover === 'copy-link'} />
        </div>
      </div>
    </header>
  );
};
