# Review shell

The reviewer's tools, separate from the product. The spec is stack-independent; the starters implement it. Design it for the reviewer (find and click fast), the developer (adapt it) and an agent (read its output): see [perspectives](perspectives.md).

## Layout

The previews get everything the controls do not need, so the reviewer never zooms the browser.

| Part | Spec |
| --- | --- |
| Previews | Fill the space left. Each frame is as tall as the window allows. Fixed widths wider than the stage scroll sideways inside it. One slim heading line with a fidelity label ("Fixture data, no network"). |
| Top bar | Compact, fixed. Sidebar toggle, Compare (if chosen), Width (Fit, Desktop 1100, Tablet 768, Phone 390, 320), Theme (the app's themes), Highlight (if enabled), then Copy link and the Changes toggle (if enabled). Visible pressed states. Wraps. |
| Navigator | Floating pill, bottom centre: Previous, state name with "n of N", Next. Only the pill takes pointer events. The name opens fixture details (description, ID, source owner, boundary, limits) in a popover above it. |
| Sidebar | 252 px, fixed, collapsible (top-bar toggle, saved in the URL, hidden by default on narrow windows). Title and revision, search, own-scrolling list, legend, pinned count and Reset state. |
| State list | Grouped by area (heading button, count, chevron, expanded at first). `aria-current`, quiet selected fill, markers. Keep focus when it redraws. Search covers area, name, id and description, shows matches inside collapsed groups, and has an empty result with Clear search. No dropdowns, no Apply button. |
| Inspector | Right column, closed at first. The Changes toggle, a badge or Select on preview opens it. Docked at 1360 px and wider, a drawer below. |
| Popover | Small and transient only: fixture details, copy-link fallback. Never pushes the preview. Escape (focus returns to its button), an outside click, or focus entering a preview closes it. Not modal. |
| Isolation | Previews are same-origin iframes at their real viewport (never scaled), so media queries work. Outer controls stay out of the product's modal tree. Reset and selection stay reachable in loading, error and modal fixtures. |
| Narrow (<820 px) | The page scrolls, the sidebar stacks on top, the top bar sticks (its height goes in a CSS variable because it wraps), the navigator is fixed. |

## Changes (only when the user chose highlights)

- **Highlights.** Outlines with numbered badges mark elements that render differently. Nothing selected: all of them on After (on Before in Before only). A change selected: only that one, on both sides. Outlines ignore pointer events. Badges are at least 22 px and step down when they overlap. Positions come from live rects, so redraw and re-measure whenever a preview scrolls or resizes (inspector, sidebar, window).
- **Select on preview.** All changes outlined, the layer takes the pointer: hover outlines the smallest changed element, click selects it, Escape exits.
- **List.** One row per element, one expanded at a time. Arrow keys and Previous/Next change step through it, hovering a row emphasizes its element, and a row, a badge or the preview select the same change (selecting again clears). Filter chips with counts: Size, Spacing, Type, Color, Shape, Motion, Text.
- **Measured.** `property  old → new` from the rendered DOM (geometry and computed style for size, spacing, type, color, fill, stroke, radius, border, shadow, motion durations, changed text). No screenshots.
  - Pair elements by `id`, then by position among same-tag siblings. One-sided elements go under "Only in After" or "Only in Before".
  - Drop noise: styles inherited from a changed parent, container sizes that follow parent or children, unpainted wrappers, hidden helpers, border colors with no border. Merge padding and margin sides that changed together.
  - Wait for entrance motion. Re-measure after use, resize, and state, theme, width or comparison changes. Every comparison mode works: an off-screen probe renders the hidden side at the visible frame's size.
- **Reasons.** Agent-written, in `notes.js`, matched by selector and optionally property. Intent only, never contradicting the numbers. A missing one shows "No reason recorded for this change."
- **For agents.** The diff is JSON in `<script type="application/json" id="rs-review-data">`, Copy as Markdown, and a status region announces the selected change.
- **Markers and locks.** Locked areas show a "Locked" chip. State rows show a filled marker (own change), hollow (area-wide only) or none (shared only), a `title` tooltip of bullets, screen-reader text and a legend. Below the list: summary notes and a collapsible "Shared across every state". Data is only `notes` and `reasons`, never hard-coded. Locked means frozen: the shell displays it, the workflow enforces it.

Idea credit: [ui-diff](https://github.com/imuratalpay/ui-diff) diffs screenshots; this measures the DOM and takes none.

## State and navigation

- **Registry:** stable `id`, `area`, `label`, `description`, `owner`, `boundary`, `limits`. List and navigation derive from it. Substate buttons only for meaningful branches. Derive it from the real app.
- **Selecting** updates navigator and previews at once. Previous and Next expand the area and scroll its row into view without moving focus. Reset discards local edits. Nothing animates on state change or reset.
- **URL:** state, theme, width, compare, highlight, sidebar. Never private input, credentials or edits. Disclose substates it does not keep in that state's `limits`. If the clipboard is refused, show the link in the popover, selected.
- **Frame messages** (`prototype:select-state`): validate origin, sender, type and registry id.
- **Comparison:** one preview by default. Chosen: Before only, After only, Side by side, with synchronized state, theme and width and independent local edits. Before imports unchanged views. A recreated layout is not a baseline.

## Starters

```text
assets/review-shell/
  core/       framework-free JavaScript and shell.css, shared by both starters
  vanilla/    plain HTML, CSS and ES modules, no build
  react/      React 18+ and TypeScript on the same core
  templates/  states.js and notes.js
```

`node scripts/init-prototype.mjs <dir> --stack vanilla|react [--no-comparison] [--no-highlights]` copies `core/`, the stack, the templates and placeholder frame pages, and sets the flags. Then:

- Fill `states.js` and `notes.js`, and check them with `scripts/check-prototype.mjs`.
- Fill the placeholder `before/frame.html` and `after/frame.html` (base path: `FRAME_BASE_URL` in `core/constants.js`). Each reads `state`, `theme` and `reset` from the query, applies the theme and renders the fixture. A fixture may call `parent.postMessage({ type: 'prototype:select-state', id }, location.origin)`.
- Serve over HTTP (`python3 -m http.server`), since modules and same-origin iframes need it. Open `vanilla/index.html`, or render `<ReviewShell areas states notes reasons />` from `react/` (needs `allowJs` and a bundler that handles CSS).
- Flags (set by the init script, or edit `core/constants.js`): `COMPARISON_ENABLED = false` for a single editable preview (the Compare group and Before frame disappear, the preview is `after/frame.html`, highlights go with it). `CHANGE_TRACKING_ENABLED = false` keeps the comparison but drops highlights, the inspector and the legend.
- Behavior lives in `core/` (reducer, URL state, diff, diff session, highlight geometry, export, stylesheet), so both starters behave the same. Change it there, never in one starter. Other stacks: reuse `core/` and write the view layer.

Use trusted same-origin preview URLs and keep native, provider and persistence calls behind fixture boundaries. For existing UI the iframes import the real product views, so portability is no reason to recreate it. Never copy example data, production imports or paths into other prototypes.

### Code conventions

`const` arrow functions. Module constants in `SCREAMING_SNAKE_CASE`. Descriptive names, no single letters. Files under 500 lines. Shared logic in `core/`. Comments say why.

### Design notes

Styled with tactile-design and checked against interaction-design and better-accessibility. The Dev Libraries and Ruixen MCPs were searched for inspector patterns. The closest were `reui/c-sidebar-4` (a right-hand inspector) and `lobe-ui/DraggablePanel`. Both are heavy React components, so only the patterns were taken. Keep a component's licence with its code if you reuse one.

## Verify

- Selecting by button and by search, no results, collapsed-group search, Reset, Previous and Next at both ends, deep-link reload, clipboard failure.
- Layout: previews fill the window, sidebar and top bar stay put, the navigator stays centred. Collapse the sidebar and open the inspector: previews resize and outlines stay on their elements. Popover behavior. Narrow window: no horizontal overflow, top bar stuck.
- Comparison: all three modes, synchronized state, theme and width.
- Highlights: outlines match elements (also after a resize), never block clicks, toggle off. A selected change outlines only itself. Row, badge and Select on preview agree. Arrow keys move selection and focus. Chips filter. Every change has a reason or says it has none. A state with no differences says so.
- Lock chip and marker kinds. Modals cannot cover the controls. Visible focus. A narrow product viewport changes the actual layout.
- With both starters, run the same checks on each.

Use the live preview and brief DOM results. No screenshot evidence unless asked.
