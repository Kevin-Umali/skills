// A searchable listbox of states grouped by area. The list is one tab stop. Arrow keys, Home and End move focus;
// Enter or Space picks the focused state.
import { useEffect, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { CHANGES_ACTIVE, SIDEBAR_OVERLAY_QUERY } from '../../core/constants.js';
import { buildIconSvg } from '../../core/icons.js';
import { getChangeKind, getChangeLines, isAreaLocked } from '../../core/registry.js';
import { useReview } from '../review-context';
import type { Area, Notes, PrototypeState } from '../types';

const LockChip = () => <span className="rs-lock" dangerouslySetInnerHTML={{ __html: `${buildIconSvg('lock')}Locked` }} />;

interface StateOptionProps {
  prototypeState: PrototypeState;
  notes: Notes;
  isSelected: boolean;
  isTabStop: boolean;
  onPick: (prototypeState: PrototypeState) => void;
}

const StateOption = ({ prototypeState, notes, isSelected, isTabStop, onPick }: StateOptionProps) => {
  const changeKind = CHANGES_ACTIVE ? getChangeKind(prototypeState, notes) : 'none';
  const hasMarker = changeKind === 'own' || changeKind === 'area';
  const title = hasMarker ? getChangeLines(prototypeState, notes).map((line: string) => `• ${line}`).join('\n') : undefined;
  return (
    <div role="option" tabIndex={isTabStop ? 0 : -1} aria-selected={isSelected} className="rs-state" data-state-id={prototypeState.id} title={title} onClick={() => onPick(prototypeState)}>
      <span>{prototypeState.label}</span>
      {hasMarker && <span className={`rs-mark rs-mark--${changeKind}`} aria-hidden="true" />}
      {hasMarker && <span className="rs-sr">{changeKind === 'own' ? ', changed in After' : ', area-wide change in After'}</span>}
    </div>
  );
};

export interface AreaGroup {
  area: Area;
  visibleStates: PrototypeState[];
}

interface StateListProps {
  groups: AreaGroup[];
  stateId: string;
  query: string;
  listRef: RefObject<HTMLDivElement>;
}

export const StateList = ({ groups, stateId, query, listRef }: StateListProps) => {
  const { notes, store } = useReview();
  // Roving tabindex: the selected row (or the first) is the one tab stop until arrow keys move it. A new query or state resets it.
  const resetKey = `${stateId}|${query}`;
  const [roving, setRoving] = useState<{ resetKey: string; stateId: string | null }>({ resetKey, stateId: null });

  const visibleIds = groups.flatMap(({ visibleStates }) => visibleStates.map((item) => item.id));
  const requestedTabStop = roving.resetKey === resetKey ? roving.stateId : null;
  const tabStopId = [requestedTabStop, stateId].find((candidate) => candidate && visibleIds.includes(candidate)) ?? visibleIds[0];

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [stateId, query]);

  const pickState = (prototypeState: PrototypeState) => store.dispatch({
    type: 'select-state',
    stateId: prototypeState.id,
    areaId: prototypeState.area,
    closesSidebar: matchMedia(SIDEBAR_OVERLAY_QUERY).matches,
  });

  const getOptions = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
  const moveFocus = (option: HTMLElement | undefined) => {
    if (!option) return;
    setRoving({ resetKey, stateId: option.dataset.stateId ?? null });
    option.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const options = getOptions();
    const index = options.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;
    const targetIndex = ({ ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 } as Record<string, number>)[event.key];
    if (targetIndex !== undefined) {
      event.preventDefault();
      moveFocus(options[Math.min(Math.max(targetIndex, 0), options.length - 1)]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      options[index].click();
    }
  };

  return (
    <div className="rs-list" id="rs-list" role="listbox" aria-label="States" ref={listRef} onKeyDown={handleKeyDown}>
      {groups.map(({ area, visibleStates }) => (
        <div key={area.id} role="group" aria-label={area.label}>
          <div className="rs-area" aria-hidden="true">{area.label}{isAreaLocked(notes, area.id) && <>{' '}<LockChip /></>}</div>
          {visibleStates.map((item) => (
            <StateOption key={item.id} prototypeState={item} notes={notes} isSelected={item.id === stateId} isTabStop={item.id === tabStopId} onPick={pickState} />
          ))}
        </div>
      ))}
      {!groups.length && (
        <p className="rs-empty">
          {`No states match “${query.trim()}”. `}
          <button type="button" className="rs-btn" onClick={() => store.dispatch({ type: 'set-query', query: '' })}>Clear search</button>
        </p>
      )}
    </div>
  );
};
