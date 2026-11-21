import { useEffect, useRef, useState } from 'react';
import './review-shell.css';

export type ReviewState = {
  id: string;
  area: string;
  label: string;
  description: string;
  owner?: string;
  boundary: string;
};
export type FrameSelection = {
  variant: 'working' | 'before' | 'after';
  stateId: string;
  theme: 'light' | 'dark';
  reset: number;
};
/** Review status: what the editable preview changes, and which areas the user has locked. */
export type ReviewChanges = {
  lockedAreas?: readonly string[];
  shared?: readonly string[];
  areas?: Readonly<Record<string, readonly string[]>>;
  states?: Readonly<Record<string, readonly string[]>>;
};
export type ReviewShellProps = {
  title: string;
  revision?: string;
  areas: readonly { id: string; label: string }[];
  states: readonly ReviewState[];
  comparison?: boolean;
  frameUrl: (selection: FrameSelection) => string;
  coverageUrl?: string;
  changes?: ReviewChanges;
};

type Theme = 'light' | 'dark';
type Compare = 'before' | 'after' | 'both';
const widths = [
  { id: 'fit', label: 'Fit', value: null },
  { id: 'desktop', label: 'Desktop', value: 1100 },
  { id: 'tablet', label: 'Tablet', value: 768 },
  { id: 'phone', label: 'Phone', value: 390 },
  { id: 'small', label: '320px', value: 320 },
];

function LockGlyph() {
  return <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M5 7V5a3 3 0 0 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v5A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5v-5A1.5 1.5 0 0 1 4.5 7H5Zm1.5 0h3V5a1.5 1.5 0 0 0-3 0v2Z" /></svg>;
}

function notesFor(changes: ReviewChanges | undefined, state: { id: string; area: string }) {
  return { own: changes?.states?.[state.id] ?? [], area: changes?.areas?.[state.area] ?? [] };
}

export function ReviewShell({ title, revision = '1', areas, states, comparison = false, frameUrl, coverageUrl, changes }: ReviewShellProps) {
  if (!states.length) throw new Error('ReviewShell needs at least one fixture.');
  const params = new URLSearchParams(window.location.search);
  const [stateId, setStateId] = useState(params.get('state') ?? states[0].id);
  const [theme, updateTheme] = useState<Theme>(params.get('theme') === 'dark' ? 'dark' : 'light');
  const [compare, setCompare] = useState<Compare>(params.get('compare') === 'before' ? 'before' : params.get('compare') === 'after' ? 'after' : 'both');
  const [widthId, setWidthId] = useState(params.get('width') ?? 'fit');
  const [resetKey, reset] = useState(0);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const state = states.find(item => item.id === stateId) ?? states[0];
  const width = widths.find(item => item.id === widthId) ?? widths[0];
  const beforeFrame = useRef<HTMLIFrameElement>(null);
  const afterFrame = useRef<HTMLIFrameElement>(null);
  const currentIndex = states.indexOf(state);

  useEffect(() => {
    document.querySelector('.review-state[aria-current]')?.scrollIntoView({ block: 'nearest' });
  }, [state.id]);
  useEffect(() => {
    const next = new URLSearchParams(window.location.search);
    next.set('state', state.id); next.set('theme', theme); next.set('width', width.id);
    if (comparison) next.set('compare', compare); else next.delete('compare');
    window.history.replaceState(null, '', `?${next}`);
  }, [state.id, compare, theme, width.id, comparison]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== beforeFrame.current?.contentWindow && event.source !== afterFrame.current?.contentWindow) return;
      const data: unknown = event.data;
      if (!data || typeof data !== 'object' || !('type' in data) || !('id' in data)) return;
      if (data.type === 'prototype:select-state' && typeof data.id === 'string' && states.some(item => item.id === data.id)) {
        selectState(data.id);
      }
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [states]);

  function selectState(id: string) {
    setStateId(id); setCopied(false); reset(value => value + 1);
    const area = states.find(item => item.id === id)?.area;
    setCollapsed(value => value.filter(id => id !== area));
  }
  async function copyLink() {
    setCopyFailed(false);
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setShowDetails(true); setCopyFailed(true); }
  }
  function frameSource(variant: 'before' | 'after' | 'working') {
    return frameUrl({ variant, stateId: state.id, theme, reset: resetKey });
  }
  const filtered = states.filter(item => `${item.label} ${item.id} ${item.description} ${areas.find(area => area.id === item.area)?.label ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="review-shell" data-theme={theme}>
      <aside className="review-sidebar" aria-label="Prototype states">
        <div className="review-brand"><span className="review-mark" aria-hidden="true">{title.slice(0, 1)}</span><div><strong>{title}</strong><span>State prototype · Revision {revision}</span></div></div>
        <div className="review-search"><label htmlFor="state-search">Find a state</label><input id="state-search" type="search" placeholder="Search states and dialogs" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <nav className="review-state-list" aria-label="Areas and states">
          {areas.map(area => {
            const items = filtered.filter(item => item.area === area.id);
            if (!items.length) return null;
            const closed = !search && collapsed.includes(area.id);
            return <section className="review-area" key={area.id}>
              <button className="review-area-toggle" aria-expanded={!closed} aria-controls={`area-${area.id}`} onClick={() => setCollapsed(value => value.includes(area.id) ? value.filter(id => id !== area.id) : [...value, area.id])}><span className="review-area-name">{area.label}{changes?.lockedAreas?.includes(area.id) && <span className="review-lock" title="Locked: approved. Changes only if reopened."><LockGlyph />Locked</span>}</span><span>{items.length}<span aria-hidden="true">{closed ? '＋' : '−'}</span></span></button>
              <div id={`area-${area.id}`} hidden={closed}>{items.map(item => {
                const { own, area: areaWide } = notesFor(changes, item);
                const kind = !changes ? undefined : own.length ? 'changed' : areaWide.length ? 'area' : 'none';
                const tip = changes ? ([...own, ...areaWide].map(line => `• ${line}`).join('\n') || 'Shared styling only.') : undefined;
                return <button key={item.id} className="review-state" data-change={kind} title={tip} aria-current={item.id === state.id ? 'page' : undefined} onClick={() => selectState(item.id)}><span className="review-state-dot" aria-hidden="true" /><span>{item.label}</span>{kind === 'changed' && <span className="review-sr-only">, changed in After</span>}</button>;
              })}</div>
            </section>;
          })}
          {!filtered.length && <p className="review-no-results" role="status">No matching states. Clear the search or try another term.</p>}
        </nav>
        {changes && <div className="review-legend" aria-hidden="true"><span><i data-change="changed" />Changed</span><span><i data-change="area" />Area changes</span>{changes.lockedAreas?.length ? <span><LockGlyph />Locked</span> : null}</div>}
        <div className="review-sidebar-footer"><span>{states.length} selectable states</span><button onClick={() => reset(value => value + 1)}>Reset state</button></div>
      </aside>
      <main className="review-main">
        <header className="review-controls">
          {comparison && <div className="review-control-group" role="group" aria-label="Compare"><span className="review-control-label">Compare</span><div className="review-segment">{([{ id: 'before', label: 'Before only' }, { id: 'after', label: 'After only' }, { id: 'both', label: 'Side by side' }] as const).map(item => <button key={item.id} aria-pressed={compare === item.id} onClick={() => setCompare(item.id)}>{item.label}</button>)}</div></div>}
          <div className="review-control-group" role="group" aria-label="Width"><span className="review-control-label">Width</span><div className="review-segment">{widths.map(item => <button key={item.id} aria-pressed={width.id === item.id} onClick={() => setWidthId(item.id)}>{item.label}</button>)}</div></div>
          <div className="review-control-group" role="group" aria-label="Theme"><span className="review-control-label">Theme</span><div className="review-segment">{(['light', 'dark'] as const).map(item => <button key={item} aria-pressed={theme === item} onClick={() => updateTheme(item)}>{item === 'light' ? 'Light' : 'Dark'}</button>)}</div></div>
        </header>
        <section className="review-context" aria-label="Selected fixture">
          <div><div className="review-context-title"><h1>{state.label}</h1><span>{currentIndex + 1} / {states.length}</span></div><p>{state.description}</p></div>
          <div className="review-context-actions"><button aria-label="Previous state" disabled={currentIndex === 0} onClick={() => selectState(states[currentIndex - 1].id)}>←</button><button aria-label="Next state" disabled={currentIndex === states.length - 1} onClick={() => selectState(states[currentIndex + 1].id)}>→</button><button aria-expanded={showDetails} onClick={() => setShowDetails(value => !value)}>Fixture details</button><button onClick={copyLink}>{copied ? 'Link copied' : 'Copy link'}</button></div>
        </section>
        {changes && (() => {
          const { own, area: areaWide } = notesFor(changes, state);
          return <section className="review-changes" aria-label="What changed">
            <div className="review-changes-head"><strong>What changed</strong>{changes.lockedAreas?.includes(state.area) && <span className="review-lock"><LockGlyph />Locked</span>}</div>
            {own.length || areaWide.length ? <ul>{[...own, ...areaWide].map(line => <li key={line}>{line}</li>)}</ul> : <p>No state-specific change. Only shared styling applies.</p>}
            {changes.shared?.length ? <details><summary>Shared across every state</summary><ul>{changes.shared.map(line => <li key={line}>{line}</li>)}</ul></details> : null}
          </section>;
        })()}
        {showDetails && <section className="review-details"><code>{state.id}</code>{copyFailed && <p role="status">Could not copy. Select the address to copy it manually: <input aria-label="Review address" readOnly value={window.location.href} onFocus={event => event.currentTarget.select()} /></p>}<p>{state.boundary}</p>{state.owner && <p>Production reference · {state.owner}</p>}</section>}
        <div className={`review-stage ${comparison && compare === 'both' ? 'review-stage-pair' : ''} ${width.value ? 'review-fixed-width' : ''}`}>
          {comparison && (compare === 'before' || compare === 'both') && <section className="review-frame-wrap" style={width.value ? { width: width.value, minWidth: width.value } : undefined} aria-label="Before preview"><div className="review-frame-heading"><strong>Before</strong><span>Frozen baseline</span></div><iframe ref={beforeFrame} key={`before-${state.id}-${resetKey}`} title={`Before ${title}`} src={frameSource('before')} /></section>}
          {(!comparison || compare === 'after' || compare === 'both') && <section className="review-frame-wrap" style={width.value ? { width: width.value, minWidth: width.value } : undefined} aria-label={comparison ? 'After preview' : 'Working preview'}><div className="review-frame-heading"><strong>{comparison ? 'After' : 'Working preview'}</strong><span>Editable fixture</span></div><iframe ref={afterFrame} key={`after-${state.id}-${resetKey}`} title={`${comparison ? 'After' : 'Working preview'} ${title}`} src={frameSource(comparison ? 'after' : 'working')} /></section>}
        </div>
        <footer className="review-footer"><span>Fictional data. Changes stay in this preview. Reset restores the selected state.</span>{coverageUrl && <a href={coverageUrl} target="_blank" rel="noreferrer">Coverage and boundaries ↗</a>}</footer>
      </main>
    </div>
  );
}

