// Left sidebar: a searchable listbox of states grouped by area, a count, Reset state and the marker legend.
import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { matchesQuery } from '../../core/registry.js';
import { Icon } from './Icon';
import { LegendPopover } from './Popovers';
import { StateList } from './StateList';
import type { AreaGroup } from './StateList';
import { useReview, useReviewPart } from '../review-context';

export const Sidebar = () => {
  const { areas, states, store } = useReview();
  const state = useReviewPart('sidebar');
  const listRef = useRef<HTMLDivElement>(null);
  const groups: AreaGroup[] = areas
    .map((area) => ({ area, visibleStates: states.filter((item) => item.area === area.id && matchesQuery(item, areas, state.query)) }))
    .filter(({ visibleStates }) => visibleStates.length);
  const shownCount = groups.reduce((total, group) => total + group.visibleStates.length, 0);
  const isLegendOpen = state.popover === 'legend';

  // Moving down from the search box lands on the list's tab stop.
  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const options = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    if (event.key !== 'ArrowDown' || !options.length) return;
    event.preventDefault();
    (options.find((option) => option.tabIndex === 0) ?? options[0]).focus();
  };

  return (
    <>
      <aside className="rs-side" id="rs-side" data-region="sidebar" aria-label="State navigation">
        <div className="rs-brand"><h1>Prototype review</h1><span>Revision 1</span></div>
        <div className="rs-search">
          <label className="rs-sr" htmlFor="rs-query">Search states</label>
          <input
            id="rs-query"
            type="search"
            placeholder="Search states"
            autoComplete="off"
            spellCheck={false}
            value={state.query}
            onChange={(event) => store.dispatch({ type: 'set-query', query: event.target.value })}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <StateList groups={groups} stateId={state.stateId} query={state.query} listRef={listRef} />
        <div className="rs-foot">
          <span id="rs-count" role="status">{state.query.trim() ? `${shownCount} of ${states.length} states` : `${states.length} states`}</span>
          <div className="rs-foot-actions">
            <div className="rs-menu-wrap" data-feature="changes">
              <button type="button" className="rs-icon-btn" id="rs-legend-button" aria-label="What the markers mean" aria-expanded={isLegendOpen} aria-controls="rs-legend-pop" onClick={() => store.dispatch({ type: 'set-popover', popover: store.getState().popover === 'legend' ? null : 'legend' })}><Icon name="help" /></button>
              <LegendPopover isOpen={isLegendOpen} />
            </div>
            <button type="button" className="rs-btn" id="rs-reset" onClick={() => store.dispatch({ type: 'reset-preview' })}>Reset state</button>
          </div>
        </div>
      </aside>
      <div className="rs-scrim" id="rs-scrim" onClick={() => store.dispatch({ type: 'set-sidebar', isOpen: false, isUserChoice: false })} />
    </>
  );
};
