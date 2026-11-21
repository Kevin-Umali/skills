# Review shell

The reviewer's tools around the preview: searchable states, Width and Theme, Before and After side by side, and optional highlights of what changed. The starters implement it fully, so build with them and do not rewrite it. The complete behavior is in [shell-spec](shell-spec.md); read that only to change the shell or to write a view layer for another stack.

```text
assets/review-shell/
  core/       framework-free JavaScript and shell.css, shared by both starters
  vanilla/    plain HTML, CSS and ES modules, no build
  react/      React 18+ and TypeScript on the same core
  templates/  states.js, notes.js and frame.html
```

## Set up

`node scripts/init-prototype.mjs <dir> --stack vanilla|react [--no-comparison] [--no-highlights]` copies `core/`, the stack, the templates and placeholder frame pages, and sets the flags. Then:

1. **Registry.** Fill `states.js`: stable kebab-case `id`, `area`, `label`, `description`, `owner`, `boundary`, `limits`, `fixture` per state. List and navigation derive from it. Use `limits` to disclose anything the URL or fixture does not keep.
2. **Frames.** Fill the placeholder `before/frame.html` and `after/frame.html` (base path: `FRAME_BASE_URL` in `core/constants.js`). Each reads `state`, `theme` (`light` or `dark`) and `reset` from the query, applies the theme and renders that state's fixture. For existing UI they import the real product views. A fixture may call `parent.postMessage({ type: 'prototype:select-state', id }, location.origin)`.
3. **Notes** (only with highlights). `notes.js` exports `notes` (`lockedAreas`, `shared`, `areas`, `states`: one line each saying what renders differently) and `reasons` (`{ selector, props?, why }`, matched to the measured changes). The templates show the shape.
4. **Check** with `scripts/check-prototype.mjs`.
5. **Serve over HTTP** (`python3 -m http.server`), since modules and same-origin iframes need it. Open `vanilla/index.html`, or render `<ReviewShell areas states notes reasons />` from `react/` (needs `allowJs` and a bundler that handles CSS).

## Flags

Set by the init script, or edit `core/constants.js`:

- `COMPARISON_ENABLED = false`: one editable preview in `after/frame.html`. The Compare group, Before frame, highlights and legend disappear.
- `CHANGE_TRACKING_ENABLED = false`: keep the comparison, drop highlights, the inspector and the legend.

Use trusted same-origin preview URLs and keep native, provider and persistence calls behind fixture boundaries. Never copy example data, production imports or paths into other prototypes.

## Verify the prototype

- `check-prototype` reports no errors, and every state loads its fixture in the frame without console errors.
- Selecting by button and by search, Previous and Next, Reset and a deep-link reload land on the right state.
- Both themes and a narrow width: no horizontal overflow, focus visible.
- With highlights: the outlines sit on the elements that changed, and each change has a reason or says it has none.
- Starters are already tested, so do not re-test their internals. Change one and you must: [shell-spec](shell-spec.md#verify-a-change-to-the-shell).

Use the live preview and brief DOM results. No screenshot evidence unless asked.
