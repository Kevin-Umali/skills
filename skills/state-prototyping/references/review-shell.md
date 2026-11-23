# Review shell

Searchable states, Width and Theme, optional Before and After, optional highlights of what changed. The starters implement it, so build with them and do not rewrite it. Behavior: [shell-spec](shell-spec.md), only to change the shell or write another stack.

`init-prototype` copies `core/` (shared logic and `shell.css`), the stack (`vanilla/` plain ES modules, or `react/` React 18+ and TypeScript), the templates and placeholder frames, and sets the flags. Its JSON lists the state fields and the notes shape. Flags live in `core/constants.js` (`COMPARISON_ENABLED`, `CHANGE_TRACKING_ENABLED`); the script sets them, so do not edit them by hand.

1. **Registry.** Fill `states.js` (or pass `--states`). Use `limits` to disclose anything the URL or fixture does not keep.
2. **Frames.** Fill `before/frame.html` and `after/frame.html` (base path `FRAME_BASE_URL`). The template shows the query params and the state-select message. Existing UI: import the real product views.
3. **Notes** (highlights only). Fill `notes.js`; the template shows the shape.
4. Run `check-prototype`.
5. **Serve over HTTP** (`python3 -m http.server`), since modules and same-origin iframes need it. Open `vanilla/index.html`, or render `<ReviewShell areas states notes reasons />` from `react/` (needs `allowJs` and a bundler that handles CSS).

Use trusted same-origin preview URLs and keep native, provider and persistence calls behind fixture boundaries. Never copy example data, production imports or paths into other prototypes.

Verify with the checklist in [exploration and verification](exploration-and-verification.md#checklist). The starters are tested, so re-test their internals only after changing one: [shell-spec](shell-spec.md#verify-a-change-to-the-shell).
