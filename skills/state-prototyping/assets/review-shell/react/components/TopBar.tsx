import { useLayoutEffect, useRef } from 'react';
import { COMPARE_OPTIONS, THEME_OPTIONS, WIDTH_OPTIONS } from '../../core/constants.js';
import { useCopyLink } from '../hooks/use-copy-link';
import { useReview } from '../review-context';

type Option = readonly [string, string];
const SEGMENTED_GROUPS: { key: 'compare' | 'width' | 'theme'; label: string; options: ReadonlyArray<Option> }[] = [
  { key: 'compare', label: 'Compare', options: COMPARE_OPTIONS },
  { key: 'width', label: 'Width', options: WIDTH_OPTIONS },
  { key: 'theme', label: 'Theme', options: THEME_OPTIONS },
];

// Compact top bar: sidebar toggle, Compare, Width, Theme, Highlight, and the Changes toggle. It never scrolls.
export const TopBar = () => {
  const { state, dispatch } = useReview();
  const { copyLink, notice } = useCopyLink(dispatch);
  const topBarRef = useRef<HTMLElement>(null);
  const changeCount = state.diff?.entries.length ?? 0;

  // The top bar sticks to the window top on narrow windows, so its height is kept in a CSS variable.
  useLayoutEffect(() => {
    const topBar = topBarRef.current;
    const root = topBar?.closest<HTMLElement>('.rs');
    if (!topBar || !root) return undefined;
    const syncHeight = () => root.style.setProperty('--rs-top-height', `${topBar.offsetHeight}px`);
    syncHeight();
    window.addEventListener('resize', syncHeight);
    const observer = new ResizeObserver(syncHeight);
    observer.observe(topBar);
    return () => {
      window.removeEventListener('resize', syncHeight);
      observer.disconnect();
    };
  }, []);

  return (
    <header className="rs-top" ref={topBarRef}>
      <button type="button" className="rs-btn" aria-controls="rs-side" aria-pressed={state.isSidebarOpen} onClick={() => dispatch({ type: 'toggle-sidebar' })}>Sidebar</button>
      {SEGMENTED_GROUPS.map(({ key, label, options }) => (
        <div className="rs-group" role="group" aria-label={label} key={key}>
          <span className="rs-group-label">{label}</span>
          <div className="rs-seg">
            {options.map(([value, optionLabel]) => (
              <button key={value} type="button" className="rs-btn" aria-pressed={state[key] === value} onClick={() => dispatch({ type: 'set-view', key, value })}>{optionLabel}</button>
            ))}
          </div>
        </div>
      ))}
      <div className="rs-group" data-feature="changes" role="group" aria-label="Highlight">
        <span className="rs-group-label">Highlight</span>
        <div className="rs-seg">
          <button type="button" className="rs-btn" aria-pressed={state.highlight} onClick={() => dispatch({ type: 'toggle-highlight' })}>Changes</button>
        </div>
      </div>
      <div className="rs-top-end">
        <span className="rs-note" role="status">{notice}</span>
        <button type="button" className="rs-btn" id="rs-copy-link" onClick={copyLink}>Copy link</button>
        <button type="button" className="rs-btn" data-feature="changes" aria-controls="rs-inspector" aria-pressed={state.isInspectorOpen} onClick={() => dispatch({ type: 'set-inspector', isOpen: !state.isInspectorOpen })}>
          Changes<span className="rs-badge">{changeCount || ''}</span>
        </button>
      </div>
    </header>
  );
};
