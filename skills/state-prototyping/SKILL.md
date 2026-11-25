---
name: state-prototyping
description: Prototype a screen or flow with realistic states (loading, empty, error, success) to review before building it. Changes are written as real project code, so the approved prototype moves into the codebase instead of being rebuilt. Use when asked to prototype, mock up or review UI states before implementing.
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)
hooks:
  PostToolUse:
    - matcher: "Write|Edit|MultiEdit"
      hooks:
        - type: command
          command: 'node "${CLAUDE_PLUGIN_ROOT}/$(test -f "${CLAUDE_PLUGIN_ROOT}/SKILL.md" || echo skills/state-prototyping/)scripts/hook-check.mjs"'
---

# State prototyping

One editable preview of the real app in selectable states, with the current screen (Before) beside the proposal (After). The After is production code written early: changed files live in `mirror/` at their project paths and move into the project on approval.

Don't change production until the user approves. Work in `.state-prototype/<flow>/` unless told otherwise. Verify with brief DOM, computed-style and behavior results, no screenshots unless asked.

## Scripts

Run them as `node ${CLAUDE_SKILL_DIR}/scripts/<name>` (the `scripts/` folder beside this file); don't read them. All print JSON; `--help` shows usage. Exit 2 means problems.

- `detect-context.mjs [dir]`: frameworks and design references.
- `init-prototype.mjs <dir> --stack react|vanilla [--states <file.json>] [--no-comparison] [--no-highlights]`: shell in `shell/`, templates, frames, `spec.js`, `measure.html`, `mirror/`, and a prototype-only `vite.config.mjs` for Vite projects. Templates show their shapes; the output lists next steps.
- `mirror-file.mjs <dir> <project-file> [--kind token|shared|view|container] [--hook <name>] [--new]`: copies a production file into `mirror/` (or starts a new one) and prints its move.
- `check-prototype.mjs <dir>`: validates the registry, notes and spec, and flags patches and stale mirrors. Run after every edit; in Claude Code a hook runs it for you and reports errors.
- `measure-prototype.mjs <dir> --mode values|parity`: serves the prototype and checks every state, theme and width headless (needs Playwright in the project; otherwise prints the URLs).

## Ask once

Run `detect-context` first. Then ask at most four questions in one call (a question tool if there is one), defaults first, and skip anything the request answers:

1. **What to prototype**, if vague: offer the screen or route you found.
2. **Before and After?** Default for existing UI: yes. Otherwise `--no-comparison`.
3. **Highlights** (outlines and a measured list of what changed)? Default: yes with a comparison, else `--no-highlights`.
4. **Helpers** from the [catalog](references/catalog.md) (read it only to offer). "None" is fine.

Shell stack: `react` for React projects, else `vanilla`. It only affects the review UI. Never block: state the default and go on.

## Workflow

Scale to the task. Read [build](references/build.md) before step 2.

1. **Explore.** Run the app; read the screens, tokens, components, state owners, and error and recovery paths down to network, native and storage boundaries. List the states that matter ([explore and verify](references/explore-and-verify.md)).
2. **Before.** Import the production views unchanged. Fixtures replace only data and side effects. Never recreate markup. A state that can't be isolated is marked unavailable, naming the boundary.
3. **After.** Mirror only the files that change, written in the project's conventions. Views take a view model and callbacks. New tokens and shared components come first. Never patch production views.
4. **States.** Loading, empty, error, saving, success, conflict, plus labeled proposals. Deterministic fixtures, in-memory callbacks, real validation and recovery. No live calls, credentials or persistence.
5. **Shell.** `init-prototype`, fill `states.js`, the two frames and `spec.js`, then `check-prototype`.
6. **Verify.** `measure-prototype --mode values`, then the checklist in explore and verify. Report what you checked and what fixtures can't prove.

## Iterate by area

Per area: critique the main surface, then dialogs, then error and edge states. Change the mirror, verify, show a short Before/After/Why table, and ask: lock or refine?

- **Record.** Numbers go in `spec.js` `values`. With highlights, `notes.js` says what changed and why (from the user's view), never a number. Update both with the code.
- **Lock** only when `measure-prototype --mode values` passes for the area. A locked area is frozen, including through shared styles; ask before touching it.
- Keep the product's structure and workflow. If a bigger proposal is rejected, refine from Before instead.

## Apply after approval

Follow [apply](references/apply.md): fix stale mirrors, move the files (tokens, shared, views, containers), swap fixtures for real hooks, and run `measure-prototype --mode parity` until only `spec.differences` remain. Then delete the mirror and fixtures.

Use helpers only as chosen, and read a skill before claiming it. For a full run-through see the [worked example](references/worked-example.md); for a stuck decision use [perspectives](references/perspectives.md).
