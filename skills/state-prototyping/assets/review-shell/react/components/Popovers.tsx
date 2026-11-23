// Small transient panels: fixture details, the marker legend, the Share menu and the copy-link fallback.
// They never push the previews. Opening one closes any other, because there is one `popover` value in the state.
import { Fragment, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { getShareActions } from '../../core/controls.js';
import { orDash } from '../../core/registry.js';
import type { PrototypeState } from '../types';

const DETAIL_ROWS: Array<[string, keyof PrototypeState]> = [['Description', 'description'], ['ID', 'id'], ['Source owner', 'owner'], ['Boundary', 'boundary'], ['Limits', 'limits']];
const FIDELITY_NOTE = 'Fixture data, no network. Previews render the registry fixtures only.';

export const DetailsPopover = ({ isOpen, current }: { isOpen: boolean; current: PrototypeState }) => (
  <div className="rs-pop" id="rs-details-pop" role="region" aria-label="Fixture details" hidden={!isOpen}>
    {isOpen && (
      <>
        <dl>
          {DETAIL_ROWS.map(([term, field]) => (
            <Fragment key={field}>
              <dt>{term}</dt>
              <dd>{orDash(current[field])}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="rs-pop-note">{FIDELITY_NOTE}</p>
      </>
    )}
  </div>
);

export const ShareMenu = ({ isOpen, onAction }: { isOpen: boolean; onAction: (action: string) => void }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Moving focus into the menu lets keyboard users reach it.
  useEffect(() => {
    if (isOpen) menuRef.current?.querySelector('button')?.focus();
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const offset = ({ ArrowDown: 1, ArrowUp: -1 } as Record<string, number>)[event.key];
    if (!offset) return;
    event.preventDefault();
    const items = [...(menuRef.current?.querySelectorAll('button') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(index + offset + items.length) % items.length]?.focus();
  };

  return (
    <div className="rs-pop rs-pop--end rs-pop--menu" id="rs-share-menu" role="menu" aria-label="Share" hidden={!isOpen} ref={menuRef} onKeyDown={handleKeyDown}>
      {getShareActions().map((action: { value: string; label: string }) => (
        <button key={action.value} type="button" className="rs-menu-item" role="menuitem" data-value={action.value} onClick={() => onAction(action.value)}>{action.label}</button>
      ))}
    </div>
  );
};

export const CopyLinkPopover = ({ isOpen }: { isOpen: boolean }) => {
  const fieldRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen) fieldRef.current?.select();
  }, [isOpen]);
  return (
    <div className="rs-pop rs-pop--end" id="rs-copy-pop" role="region" aria-label="Copy link" hidden={!isOpen}>
      {isOpen && (
        <>
          <p>Could not copy automatically. Copy the link from here:</p>
          <input readOnly aria-label="Review link" defaultValue={location.href} ref={fieldRef} />
        </>
      )}
    </div>
  );
};

const LegendRow = ({ markClass, text }: { markClass: string; text: string }) => (
  <div className="rs-legend-row"><span className={`rs-mark ${markClass}`} aria-hidden="true" /><span>{text}</span></div>
);

export const LegendPopover = ({ isOpen }: { isOpen: boolean }) => (
  <div className="rs-pop rs-pop--up" id="rs-legend-pop" role="region" aria-label="Marker legend" hidden={!isOpen}>
    <LegendRow markClass="rs-mark--own" text="Changed in this state" />
    <LegendRow markClass="rs-mark--area" text="Area-wide change only" />
  </div>
);
