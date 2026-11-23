# Changelog

## 0.1.3

- Redesigned review shell: one-row toolbar with a breadcrumb and Previous/Next replaces the floating navigator, so nothing sits over the previews. The inspector docks on wide windows and becomes a sheet on narrow ones, and the sidebar is an overlay under 1100px. Split is the default only when the stage is wide enough, with a notice when the previews are too narrow.
- New Slider compare mode (drag, arrow keys, `split` in the URL) beside Split, Before and After.
- Agent hooks: `data-region`, `data-control` and `data-value` attributes, radiogroup and listbox keyboard behavior, and URL params `split`, `inspector` and `change`. `#rs-review-data` follows the selected change, including after a category filter.
- Runtime: cached measuring, single-pass element pairing, frame-coalesced redraws, scoped re-renders, a throttled resize observer, and nothing attached when changes are off. With changes off the inspector, change selection and highlight actions and URL params are ignored. `MEASURE_TRIGGER_ACTIONS` lives in `core/render-scopes.js` for both starters.
- Docs, templates and scripts: `init-prototype --states`, `stateFields` and `notesShape` in its output, empty `states.js` and `notes.js` templates, and one checklist in place of several.
- `state-prototyping`: the opening questions now start with what to prototype when the request is vague (for example only `/state-prototyping table`), allow at most four questions per tool call, and default the shell stack from `detect-context`.
- Single-preview mode and a highlights switch, set by `init-prototype --no-comparison` and `--no-highlights` instead of editing the copied shell. With no comparison the Compare group, Before frame, highlights and legend are gone.
- `init-prototype` also writes placeholder `before/frame.html` and `after/frame.html` pages that read `state`, `theme` and `reset`.
- `check-prototype` no longer asks for `before/frame.html` in single-preview mode. Fixed the `hidden` attribute being overridden by flex in the shell CSS.
- Skill text now says to serve the shell over HTTP, record unencoded substates in `limits`, and scale the work to the task.
- Shell hardening: re-measuring after you use a preview keeps your selected change and the last diff instead of resetting them; outlines skip elements the preview removed; a preview that cannot be measured now says so instead of showing "Measuring…" forever; fixture details show a dash for missing fields; an empty registry says so.
- `check-prototype` errors on an empty registry and warns about missing `owner`, `boundary`, `limits` or `fixture` and ids that are not lowercase and hyphenated, so prototypes come out consistent.
- Less to read: `review-shell.md` is now a short setup guide and the full behavior moved to `shell-spec.md`, which is read only to change the shell. `SKILL.md` says when to read each reference. A typical new-UI run reads about 12.7 KB instead of about 17.5 KB.
- Highlights no longer clutter the preview: resting shows quiet 1px outlines on the innermost changed elements only, with a badge on hover. With the inspector open, badges sit outside their box and overlapping ones collapse into a count that marks those changes in the list. A selected change is drawn in full as before. The rules live in `core/highlight-geometry.js` and `core/shell.css`, so both starters match.
- Found by running the original and current skill on the same task. In that trial the fixed skill used fewer tokens and tool calls than either earlier run.

## 0.1.2

- `state-prototyping`: opening questions use the harness's question tool and cover design references, helpers, Before and After, and highlights.
- Catalog now lists skills and MCP servers (`devlibs`, `ruixen-mcp`), each with a website or GitHub source, plus `tactile-design` and `interaction-design`.
- Review shell: a fixed window with previews filling the content area, a compact top bar, a floating Previous/Next navigator, a collapsible sidebar and a docked Changes inspector.
- Highlights (optional): outlines and badges over changed elements, a measured `property  old → new` list with agent-written reasons, and JSON and Markdown output. Selecting a change outlines only it. Works in every comparison mode.
- Vanilla and React starters share a framework-free `core/` and behave the same.
- Scripts: `init-prototype`, `check-prototype`, `detect-context`.
- Skill text cut roughly in half. User, developer and agent experience are a lens, not UI.
- Made stack-agnostic, removed machine-specific paths, replaced the career example with a billing one.

## 0.1.1

- `state-prototyping`: made stack-agnostic (React starter moved to `assets/review-shell/react/`), removed machine-specific paths from the skill catalog, replaced the career example with a generic billing worked example.

## 0.1.0

- Added `state-prototyping`.
