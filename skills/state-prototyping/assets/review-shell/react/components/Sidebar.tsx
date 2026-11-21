import { getChangeKind, getChangeLines, isAreaLocked, matchesQuery } from '../../core/registry.js';
import { useReview } from '../review-context';
import type { PrototypeState } from '../types';

const CHEVRON_PATH = 'M2 3.5l3 3 3-3';

const LockChip = () => (
  <span className="rs-lock">
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden="true">
      <rect x="2" y="5.25" width="8" height="5" rx="1.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M4 5V3.75a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
    Locked
  </span>
);

const StateButton = ({ prototypeState }: { prototypeState: PrototypeState }) => {
  const { notes, state, dispatch } = useReview();
  const changeKind = getChangeKind(prototypeState, notes);
  const hasMarker = changeKind === 'own' || changeKind === 'area';
  const title = hasMarker ? getChangeLines(prototypeState, notes).map((line: string) => `• ${line}`).join('\n') : undefined;
  return (
    <button
      type="button"
      className="rs-state"
      title={title}
      aria-current={prototypeState.id === state.stateId ? 'true' : undefined}
      onClick={() => dispatch({ type: 'select-state', stateId: prototypeState.id, areaId: prototypeState.area })}
    >
      {prototypeState.label}
      {hasMarker && <span className={`rs-mark rs-mark--${changeKind}`} />}
      {hasMarker && <span className="rs-sr">{changeKind === 'own' ? ', changed in After' : ', area-wide change in After'}</span>}
    </button>
  );
};

export const Sidebar = () => {
  const { areas, states, notes, state, dispatch } = useReview();
  const isSearching = Boolean(state.query.trim());
  const groups = areas
    .map((area) => ({ area, visibleStates: states.filter((item) => item.area === area.id && matchesQuery(item, areas, state.query)) }))
    .filter(({ visibleStates }) => visibleStates.length);
  const shownCount = groups.reduce((total, group) => total + group.visibleStates.length, 0);

  return (
    <aside className="rs-side" id="rs-side" aria-label="States">
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
          onChange={(event) => dispatch({ type: 'set-query', query: event.target.value })}
        />
      </div>
      <nav className="rs-list" aria-label="State list">
        {groups.map(({ area, visibleStates }) => {
          const isOpen = isSearching || !state.collapsedAreaIds.includes(area.id);
          return (
            <div key={area.id}>
              <button type="button" className="rs-area-btn" aria-expanded={isOpen} aria-controls={`rs-group-${area.id}`} onClick={() => dispatch({ type: 'toggle-area', areaId: area.id })}>
                <svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d={CHEVRON_PATH} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>{area.label}</span>
                {isAreaLocked(notes, area.id) && <LockChip />}
                <span className="rs-count">{visibleStates.length}</span>
              </button>
              <div id={`rs-group-${area.id}`} hidden={!isOpen}>
                {visibleStates.map((item) => <StateButton key={item.id} prototypeState={item} />)}
              </div>
            </div>
          );
        })}
        {!groups.length && (
          <p className="rs-empty">
            No states match “{state.query.trim()}”.{' '}
            <button type="button" className="rs-btn" onClick={() => dispatch({ type: 'set-query', query: '' })}>Clear search</button>
          </p>
        )}
      </nav>
      <p className="rs-legend">
        <span className="rs-mark rs-mark--own" aria-hidden="true" />Changed here
        <span className="rs-mark rs-mark--area" aria-hidden="true" />Area-wide only
      </p>
      <div className="rs-foot">
        <span role="status">{isSearching ? `${shownCount} of ${states.length} states` : `${states.length} states`}</span>
        <button type="button" className="rs-btn" onClick={() => dispatch({ type: 'reset-preview' })}>Reset state</button>
      </div>
    </aside>
  );
};
