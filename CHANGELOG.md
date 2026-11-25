# Changelog

## Unreleased

Production-shaped After (`state-prototyping`)

- The After is production code written early. Changed files live in `<prototype>/mirror/` at their project paths, in the project's styling system, tokens and components; unchanged modules are imported. On approval they move into the project instead of being rebuilt.
- Why: in a real implementation, an After built from source rewrites and override CSS (`!important`, `[data-prototype-variant]`) left nothing to copy, raw values skipped the theme scale, rewrites broke when production changed, notes contradicted the code, and "matches the prototype" had no definition.
- After views take a view model and callbacks; views that fetch are split into view and container. New tokens and shared components go into their mirror files first.
- New `spec.js`, one place for numbers: `values` (rendered CSS per area, optional `states` and `themes`), `differences` (what production deliberately keeps) and `moves` (mirror path, project path, kind, base hash, container hook). `notes.js` no longer holds numbers.
- New `measure.html` and `core/spec-check.js`, shared by both starters. Mode `values` checks the After against `spec.values` and font loads; mode `parity` diffs Before and After with `computeDiff` and fails outside `spec.differences`. An area locks only when values pass.
- New scripts: `mirror-file.mjs` mirrors a production file and prints its move and hash; `measure-prototype.mjs` serves the prototype itself (Vite or static), runs every state, theme and width headless with the project's Playwright, and groups failures per element.
- Vite projects get a prototype-only `vite.config.mjs`: the project's config plus a mirror plugin, with `STUBS` to give a Before view a fixture instead of its data hook. The project's own config is not touched.
- `check-prototype` validates `spec.js`, errors on patches in the mirror and on Before importing it, and warns on stale mirrors and on numbers in notes.
- New references `build.md` and `apply.md`. Apply moves tokens, shared, views and containers in order and runs parity until clean.

Found by a trial (old and new skill on the same React, Vite and Tailwind task)

- The shell is now copied to `shell/`: a folder named `react/` hid the `react` package. React prototypes get a host page (`shell/index.html`).
- Previous and Next follow the sidebar's area order instead of the order in `states.js`.
- `init-prototype` prints only next steps (274 words down to 88); the templates document their own shapes.
- Skill text cut: the default reading path is 1,520 words, down from 2,271 in 0.1.3. `production-shaped-after.md`, `review-shell.md` and `exploration-and-verification.md` became `build.md` and `explore-and-verify.md`, and `perspectives.md` is optional.
- Plainer skill description, README summary and Codex agent card.
- React frames are `frame.html` plus `frame.tsx`, since an inline module script can't hold JSX.
- `mirror-file --new` starts a mirror file production doesn't have yet. Splitting a fetching view keeps its file as the container, so callers don't change.
- `build.md` gives a tsconfig `paths` recipe for type-checking the mirror.
- `core/package.json` marks the shared core as ES modules, so Node loads it without a warning. Code comments trimmed to the ones that say why.

Hooks (`state-prototyping`)

- New `scripts/hook-check.mjs`: after an edit inside a prototype, runs `check-prototype` and feeds its errors back to the agent (exit 2). It reads both Claude Code's edit input and Codex's `apply_patch` input, and stays silent for edits outside a prototype.
- `SKILL.md` registers it as a Claude Code `PostToolUse` hook once the skill is invoked, and pre-approves the skill's own scripts with `allowed-tools`. Other agents ignore both fields.

## 0.1.3

Review shell (layout)

- One-row toolbar with a breadcrumb and Previous/Next replaces the floating navigator, so nothing sits over the previews.
- The inspector docks on wide windows and becomes a sheet on narrow ones. The sidebar is an overlay under 1100px, and its area groups no longer collapse.
- One Changes button replaces the Highlight and Changes buttons. A Share menu (copy link, copy changes as Markdown or JSON) replaces Copy link.
- Tactile visual pass: segmented controls instead of black pressed buttons, and no animation on first load.
- Single-preview mode and a highlights switch, set by `init-prototype --no-comparison` and `--no-highlights` instead of editing the copied shell. With no comparison the Compare group, Before frame, highlights and legend are gone.

Compare

- New Slider mode (drag, arrow keys, `split` in the URL) beside Split, Before and After.
- Split is the default only when the stage is wide enough, with a notice when the previews are too narrow.

Highlights

- Resting shows quiet 1px outlines on the innermost changed elements only, with a badge on hover. With the inspector open, badges sit outside their box and overlapping ones collapse into a count that marks those changes in the list. A selected change is drawn in full as before. The rules live in `core/highlight-geometry.js` and `core/shell.css`, so both starters match.
- Re-measuring after you use a preview keeps your selected change and the last diff instead of resetting them. Outlines skip elements the preview removed.
- A preview that cannot be measured now says so instead of showing "Measuring..." forever. Fixture details show a dash for missing fields, and an empty registry says so.

Agent and keyboard hooks

- `data-region`, `data-control` and `data-value` attributes, radiogroup and listbox keyboard behavior, and URL params `split`, `inspector` and `change`.
- `#rs-review-data` follows the selected change, including after a category filter.
- With changes off, the inspector, change selection, highlight actions and URL params are ignored.

Performance

- Cached measuring, single-pass element pairing, frame-coalesced redraws and scoped re-renders.
- The mutation observer is throttled (re-measures at most twice a second and ignores the hidden probe frame).
- Nothing is attached when changes are off.

Scripts and checks

- `init-prototype --states <file.json>` writes `states.js`. Its output includes `stateFields` and `notesShape`, and it writes empty `states.js` and `notes.js` templates.
- `init-prototype` also writes placeholder `before/frame.html` and `after/frame.html` pages that read `state`, `theme` and `reset`.
- `check-prototype` errors on an empty registry and warns about missing `owner`, `boundary`, `limits` or `fixture`, ids that are not lowercase and hyphenated, and states with no notes once some notes exist.
- `check-prototype` no longer asks for `before/frame.html` in single-preview mode. Fixed the `hidden` attribute being overridden by flex in the shell CSS.

Skill text and docs

- `review-shell.md` is now a short setup guide and the full behavior moved to `shell-spec.md`, which is read only to change the shell. `SKILL.md` says when to read each reference.
- The docs were deduplicated, each rule stated once. The new-UI reading path (`SKILL.md`, review-shell, catalog and perspectives) went from about 16.2 KB to 14.4 KB this round.
- The opening questions start with what to prototype when the request is vague (for example only `/state-prototyping table`), allow at most four questions per tool call, and default the shell stack from `detect-context`.
- Skill text says to serve the shell over HTTP, record unencoded substates in `limits`, and scale the work to the task. One checklist replaces several.
- Found by running the original and current skill on the same task. That trial drove single-preview mode and the init flags, and the fixed skill used fewer tokens and tool calls than either earlier run.

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
