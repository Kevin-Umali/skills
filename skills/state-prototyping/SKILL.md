---
name: state-prototyping
description: Build an editable UI prototype with selectable, realistic application states for visual or interaction review before production implementation.
---

# State prototyping

Build one editable working preview grounded in the real app. Prototype first: do not change production source until the user approves, unless they already authorized it. Keep files in `.state-prototype/<flow>/` unless the user names a place, and report the location.

## Scripts (run them, do not read them)

All print JSON. `--help` shows usage.

- `node scripts/detect-context.mjs [dir]`: frameworks and design references found. Run before asking questions.
- `node scripts/init-prototype.mjs <dir> --stack vanilla|react`: copies the review shell and templates.
- `node scripts/check-prototype.mjs [dir]`: validates `states.js` and `notes.js`. Run after editing them. Exit 2 means problems.

## Opening questions

Ask once. With a structured question tool (for example `AskUserQuestion`), use one call: recommended default first, helpers as multi-select. Otherwise ask one short message stating defaults. Skip what the request answers or you can find out, and never block: state the default and go on.

1. **Design references.** Use `detect-context`. Ask only if none are found or they conflict; accept a path or link.
2. **Helpers.** Offer the relevant skills and MCP servers from the [catalog](references/catalog.md). The user may name their own. "None" is valid.
3. **Before and After.** Existing UI: ask for a frozen Before beside an editable After. Default: one editable preview. New UI: ask only if there are versions to compare.
4. **Highlights.** Only with a comparison: show what changed (outlines, measured diff list)? Yes: build and enable it. No: set `CHANGE_TRACKING_ENABLED = false` in `core/constants.js` and build none of it. Default: yes when comparing.

## Workflow

1. **Explore.** Existing UI: run the app, read screens, design system, components, state owners, callbacks, error and recovery paths, down to network, native and persistence boundaries. New UI: read the design system and integration contracts, and separate requested behavior from assumptions. Build an evidence-based state inventory ([exploration and verification](references/exploration-and-verification.md)).
2. **Import the real UI.** Existing UI: import production screens, dialogs, controls, styles and tokens. Replace only data and side effects with typed fixtures and local callbacks. Trace nested containers and use prototype-scoped adapters that render the real children. Never recreate markup, layouts from screenshots, or lookalike dialogs. If something cannot be isolated, mark that state unavailable and name the boundary. Record imports, fixture controllers, proposed changes and unavailable behavior. New UI: derive states from requested behavior and label design assumptions.
3. **Model the states.** Loading, empty, error, saving, stopped, success, conflict, plus labeled proposed states. Fictional deterministic fixtures, in-memory callbacks, stable held-pending samples. Keep real validation, disabled actions, drafts and recovery. No live calls, native operations, credentials or persistence. Never fake a provider response.
4. **Build the review shell.** Run `init-prototype`, then follow the [review shell](references/review-shell.md).
5. **Think from three perspectives.** Decide and critique as the user, the developer who will build it, and an agent that operates or reads it ([perspectives](references/perspectives.md)). It adds nothing to the shell. Say which one drove a notable decision.
6. **Inspect.** Run it locally. Check states, widths, themes, keyboard focus and interactions through DOM, computed-style and behavior checks. No screenshots or bulky evidence unless asked. Report concise results and limits: fixtures do not verify native, live or persisted behavior. After approved changes land, remove only obsolete prototype files.

## Comparison (only when chosen)

Before = the frozen production views at the agreed start (recover real source, never recreate). After = the editable proposal; shared production components stay in After and overrides are scoped to the prototype. Same state, theme and width on both. Keep ids and structure stable so elements pair, and mark states that exist only in After. Feedback edits go to After. Without a comparison, "Before" just names the single working preview; say so if the user's "Before" meant that. New UI: compare only versions the user specifies.

## Iterate by area

Per area: inspect its states, critique main surfaces, then dialogs, then error and edge states (never spend a pass only on edge states while the main view is unchanged), implement and verify, report a short Before/After/Why table, then ask whether to lock or refine and stop.

- **Record** in `notes.js`: `notes` (`lockedAreas`, `shared`, `areas`, `states`) holds one line per change saying what renders differently. `reasons` holds a selector-matched why for every change, from the user's point of view. "No reason recorded" is a gap to fix. A reason never contradicts the measured numbers. Update both with the code, and correct them on revert. Keep a Before/After/Why log in the coverage document.
- **Locks.** "Lock" adds the area to `lockedAreas` and logs it. A locked area is frozen, including through shared styles and new rules: scope new styles, and if a rule would touch a locked area, say so and ask. Log reopen-and-relock. When all areas are locked, rerun the full render check.

## Keep the product direction

The shell and the product are separate designs. Keep the preferred layout's structure, navigation and workflow, and refine controls, hierarchy, feedback and motion. If a broader proposal is rejected, replace it with refinements grounded in Before. Keep a recoverable copy before replacing substantial work.

## Helpers

Use only what the user chose. Read each skill first and never claim one you did not read or could not use. If one is missing, offer it and ask before installing or connecting; never guess a source. Helpers do not authorize a redesign. Review criteria for errors and pending states: a toast plus a minimal indicator for action errors, inline validation or a blocking load where fitting, spinners inside buttons with stable geometry. They never replace real app behavior.
