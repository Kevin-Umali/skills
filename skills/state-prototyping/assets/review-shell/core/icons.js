// Icon artwork shared by both starters: the inner markup of a 16x16 stroke icon. Wrap it in an <svg viewBox="0 0 16 16">.
export const ICON_VIEW_BOX = '0 0 16 16';
export const ICON_STROKE_ATTRIBUTES = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export const ICON_MARKUP = {
  sidebar: '<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M6 3v10"/>',
  previous: '<path d="M10 3.5L5.5 8l4.5 4.5"/>',
  next: '<path d="M6 3.5L10.5 8 6 12.5"/>',
  sun: '<circle cx="8" cy="8" r="2.75"/><path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9"/>',
  moon: '<path d="M13.25 9.6A5.5 5.5 0 016.4 2.75a5.5 5.5 0 106.85 6.85z"/>',
  changes: '<path d="M3 4.5h10M3 8h6.5M3 11.5h8"/>',
  share: '<path d="M8 10V2.5M5.25 5.25L8 2.5l2.75 2.75M3 8.5v3.25A1.25 1.25 0 004.25 13h7.5A1.25 1.25 0 0013 11.75V8.5"/>',
  check: '<path d="M3.5 8.5l3 3 6-7"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  help: '<circle cx="8" cy="8" r="6"/><path d="M6.25 6.25a1.85 1.85 0 113.1 1.35c-.7.6-1.35.95-1.35 1.9M8 11.4v.1"/>',
  grip: '<path d="M6 4.5L3.5 8 6 11.5M10 4.5L12.5 8 10 11.5"/>',
  lock: '<rect x="3.5" y="7" width="9" height="6" rx="1.5"/><path d="M5.5 7V5.25a2.5 2.5 0 015 0V7"/>',
};

export const buildIconSvg = (name) =>
  `<svg viewBox="${ICON_VIEW_BOX}" ${ICON_STROKE_ATTRIBUTES} aria-hidden="true" focusable="false">${ICON_MARKUP[name]}</svg>`;
