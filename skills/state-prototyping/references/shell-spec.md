# Shell spec

The full behavior of the review shell. The starters already implement it, so read this only to change the shell or to write a view layer for another stack. Design it for the reviewer (find and click fast), the developer (adapt it) and an agent (read its output): see [perspectives](perspectives.md).

`init-prototype` copies the chosen starter (`vanilla/` or `react/`, plus a host page for React) into the prototype's `shell/`. Behavior lives in `core/` and the view layers only render it, so both starters behave the same: change it in `core/`, never in one starter. Which module owns what:

| Module | Owns |
| --- | --- |
| `constants.js` | Flags (`COMPARISON_ENABLED`, `CHANGE_TRACKING_ENABLED`), breakpoints, sizes, timings, diff properties |
| `controls.js` | Control definitions (Compare, Width, Theme options, Share actions), view announcement text |
| `view-state.js` | URL parse and serialise, load-time defaults (sidebar, compare), frame URL |
| `review-reducer.js` | Every state change, as one reducer. `render-scopes.js` says which parts an action touches |
| `slider.js`, `stage-notices.js`, `scroll-sync.js` | Slider math and keys, inline notices, two-frame scroll mirroring |
| `diff.js`, `measure.js`, `diff-session.js` | The measured diff, its per-run cache, when to measure |
| `highlight-geometry.js`, `export-changes.js`, `registry.js` | Boxes, badges and their placement, Markdown and JSON, registry helpers (state order follows the areas) |
| `spec-check.js` | `measure.html`: frames at a fixed width, `spec.values` and font checks, parity against `spec.differences` |
| `icons.js`, `scheduling.js`, `shell.css` | Icon artwork, frame and throttle helpers, all styles |

## Layout

Grid: `sidebar | main | inspector`. Main is a toolbar plus the stage. Nothing floats over the previews. Previews are same-origin iframes at their real viewport (never scaled), so media queries work.

| Part | Spec |
| --- | --- |
| Toolbar | 48 px, sticky, one row from 1024 px up. Left: sidebar toggle, breadcrumb "Area / State" with "n of N", Previous and Next. Centre: Compare (`Before`, `After`, `Split`, `Slider`) and Width (`Fit`, `Desktop`, `Tablet`, `Phone`, `Small`). Right: preview theme icon, Changes (count badge, toggles the inspector), Share menu (Copy link, Copy changes as Markdown, Copy changes as JSON). Group labels are `aria-label` and `title` only. |
| Toolbar tiers | By the toolbar's own width, because docked panels take room from it: under 1100 px Width is a native `<select>`, under 900 px Changes and Share lose their text and the "n of N" goes, under 760 px Compare is a select too. Below a 820 px window it wraps to two rows (breadcrumb and Previous/Next, then the view controls). |
| Details popover | Opens from the breadcrumb, anchored below it, 360 px at most: description, ID, source owner, boundary, limits, and one fidelity line ("Fixture data, no network"). |
| Sidebar | 264 px, sticky, collapsible, its list scrolls alone. Title, search (36 px), list (area heading 12/16, state rows 32 px), footer (state count, `?` legend popover when change tracking is on, Reset state). Below 1100 px it is an overlay sheet with a scrim, closed by default; Escape, the scrim and picking a state close it. |
| Stage | Fills the rest. Frame header 28 px: "Before · frozen", "After · editable", or "Preview" for a single preview. A fixed width wider than the stage scrolls sideways inside it. |
| Inspector | From 1280 px a docked 340 px column that pushes the stage. Below that a bottom sheet (45dvh) with the preview visible above it, a close button and Escape. Sticky header: count, Highlight toggle, filter chips (one row, scrolls sideways), Previous and Next change, Select on preview. `[` and `]` step through changes when focus is not in a text field. |
| Popovers | Small and transient: details, legend, Share menu, copy-link fallback. Never push the preview. Escape (focus returns to the button), an outside click, or focus entering a preview closes them. Not modal. |
| Breakpoints | 820 (toolbar wraps), 1100 (sidebar overlay), 1280 (inspector docks). Numbers live in `constants.js` and are repeated once, in the media queries at the top of `shell.css`. |

Defaults are computed on every load from the window width: the sidebar is open from 1100 px, and Compare is `Split` when the stage will be at least 1000 px wide and comparison is on, otherwise `After`. Neither is written to the URL until the reviewer changes it. If Split makes a frame narrower than 480 px, one inline notice sits above the previews: "Each preview is 372px wide, so the product shows its phone layout." with "Show After only".

## Compare

One editable preview by default. Chosen (`COMPARISON_ENABLED`): Before, After, Split, Slider, with synchronized state, theme and width and independent local edits. Before imports unchanged views. A recreated layout is not a baseline.

**Slider.** Two same-size frames stacked, Before on top, clipped by `clip-path: inset(0 calc(100% - var(--rs-split)) 0 0)`. Left of the divider is Before, right is After; pointer events reach the frame visible at that point.
- Handle: 40 px hit target, 2 px line, 28 px grip, `role="slider"`, `aria-label="Before and After divider"`, `aria-valuemin`/`max`/`now`, `aria-valuetext="62% Before"`. Pointer capture on the handle only.
- Keys: Left and Right 1%, with Shift 10%, Home 0, End 100, Enter centres. Double-click centres.
- Scroll is mirrored both ways. If the two documents differ in height by more than 8 px, an inline notice says so and offers "Use Split". It never blocks.

## Changes (only when the user chose highlights)

- **Highlights.** Rules live in `highlight-geometry.js` and `shell.css` (`data-mode` on each layer); view layers only render. Outlines are quiet (1 px, reduced opacity, no fill) and take no pointer events except a thin ring, so hovering one raises it without blocking the preview. Resting (inspector closed, nothing selected): After only (Before in Before only), innermost changed elements only, badge shown on hover; a container whose change is represented by changed descendants is skipped (it stays in the list). Inspector open, nothing selected: every listed change gets an outline and badge, and hovering a list row emphasises its box. A change selected: only that one, on both sides, in full. Inspect mode shows all with the same badge placement. Badges are 22 px, sit just above a box's top-left corner (else left, right or below when a neighbouring change is in the way), never over the box, and inside the frame. Badges that would land within one badge size of each other collapse into one count badge; hover, focus or click marks those changes in the list. Elements scrolled out of the frame are not drawn. In Slider each side's boxes are clipped to its visible half. Redraw whenever a preview scrolls or resizes (inspector, sidebar, window).
- **Select on preview.** All changes outlined, the layer takes the pointer: hover outlines the smallest changed element, click selects it, Escape exits.
- **List.** One row per element, one expanded at a time. Arrow keys and Previous/Next step through it, hovering a row emphasizes its element, and a row, a badge or the preview select the same change (selecting again clears). Filter chips with counts: Size, Spacing, Type, Color, Shape, Motion, Text.
- **Measured.** `property  old → new` from rendered geometry and computed style. No screenshots.
  - Pair elements by `id`, then by position among same-tag siblings. One-sided elements go under "Only in After" or "Only in Before".
  - Drop noise: styles inherited from a changed parent, container sizes that follow parent or children, unpainted wrappers, hidden helpers, border colors with no border. Merge padding and margin sides that changed together.
  - Wait for entrance motion. Re-measure after use, resize, and state, theme, width or comparison changes. An off-screen probe renders the hidden side at the visible frame's size, so every comparison mode works.
- **Reasons.** Agent-written, in `notes.js`, matched by selector and optionally property. Intent only, never contradicting the numbers. A missing one shows "No reason recorded for this change."
- **Markers and locks.** Locked areas show a "Locked" chip. State rows show a filled marker (own change), hollow (area-wide only) or none (shared only), a `title` tooltip, screen-reader text and the legend. Below the list: summary notes and a collapsible "Shared across every state". Locked means frozen: the shell displays it, the workflow enforces it.
- **Cost.** One measurement per element per side, reused by every check. Sibling positions are counted once per parent. Redraws are coalesced per animation frame, read before they write, and move boxes that already exist. Preview mutations are filtered (class, style, hidden, disabled, `aria-*`, open, value, checked) and re-measure at most twice a second. With change tracking off there is no probe, observer or diff listener.

## State and navigation

- **Registry:** stable `id`, `area`, `label`, `description`, `owner`, `boundary`, `limits`. List and navigation derive from it. Derive it from the real app.
- **Selecting** updates breadcrumb and previews at once. Previous and Next scroll the sidebar row into view without moving focus. Reset discards local edits. Nothing animates on state change or reset, and nothing animates on first paint (transitions start once `data-ready` is on the root).
- **Frame contract:** the frame page reads `state`, `theme` and `reset`; it may post `prototype:select-state` to the shell, which validates origin, sender, type and registry id.

### URL

Defaults are left out. Never private input, credentials or edits. Disclose substates the URL does not keep in that state's `limits`. If the clipboard is refused, show the link in a popover, selected.

| Param | Values | Written when |
| --- | --- | --- |
| `state` | registry id | always |
| `theme` | `light`, `dark` | not `light` |
| `width` | `fit`, `1100`, `768`, `390`, `320` | not `fit` |
| `compare` | `before`, `after`, `split`, `slider` | the reviewer chose one (`side` still reads as `split`) |
| `split` | 0 to 100, integer | compare is `slider` and not 50 |
| `highlight` | `0` | highlights are off |
| `sidebar` | `1`, `0` | the reviewer toggled it |
| `inspector` | `1` | the inspector is open |
| `change` | index of the selected change | one is selected |

### Hooks for agents and tests

- Regions: `data-region="toolbar|sidebar|stage|inspector"`. Controls: `data-control="compare|width|theme|changes|share|sidebar"` (the select variants of Compare and Width are `compare-select` and `width-select`). Every option has `data-value`. State rows have `data-state-id`.
- Segmented controls are `role="radiogroup"` with `role="radio"` and `aria-checked`, a roving tabindex and arrow keys. The state list is one `role="listbox"` tab stop with `aria-selected`, Up, Down, Home and End moving focus, Enter or Space choosing.
- `<script type="application/json" id="rs-review-data">` holds `view` (state, compare, width, theme, split), `selectedChange`, and the measured changes (`measured: false` before the first measurement).
- `#rs-live` announces "Showing <Area>: <State>, <compare>, <width>" on state or view change, and the selected change.
- Copy as Markdown and Copy as JSON are in the Share menu; results show on the Share button, never as a toast over the previews.

## Visual tokens

Styled with tactile-design. 4 px grid. Toolbar padding 7 px 12 px, gaps 8 px in a group and 16 px between groups. Radius 6 for controls, 8 for panels and frames, full for chips and the segmented thumb. Type 13/20 body, 12/16 meta, 15/20 sidebar title, weight 500 only.
Light: ground `#f9f9f8`, surface `#ffffff`, well `#f1f0ef`, line `#dad9d6`, ring `0 0 0 1px rgb(33 32 28 / .08)`, drop `0 1px 2px rgb(33 32 28 / .12)`. Dark: ground `#080807`, surface `#191918`, well `#222221`, line `#3b3a37`, raised outline 0.5px `#494844` plus a black drop.
The segmented control is a well with a raised thumb under the selected option. The shell has no primary button. Accent colour is for change badges and highlights only. Shell chrome follows the OS scheme; the product's own theme is the "Preview theme" control.

## Verify a change to the shell

Run it on each starter. Use the live preview and brief DOM results; no screenshots unless asked.

- Selecting by row, keyboard and search; no results; Reset; Previous and Next at both ends; deep-link reload restores state, compare, split, inspector and change; clipboard failure.
- Layout at 1440, 1280, 1024 and 390 px wide: toolbar is one row from 1024 up and two rows below 820, nothing sits over the previews, no horizontal overflow. Sidebar is docked from 1100 and an overlay below it. Inspector is docked from 1280 and a bottom sheet below it.
- Compare: all four modes keep state, theme and width. Slider: drag, keys, double-click, `split` in the URL, scroll mirrored, both notices.
- Highlights: outlines match elements (also after a resize), never block clicks, toggle off. The resting view is readable and no badge covers its own box. A selected change outlines only itself. Row, badge and Select on preview agree. `[` and `]` and arrow keys move selection. Chips filter. Every change has a reason or says it has none.
- Both OS colour schemes. No console errors. Also run with `COMPARISON_ENABLED = false` and with `CHANGE_TRACKING_ENABLED = false`.
