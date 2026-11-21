---
name: state-prototyping
description: Build an editable UI prototype with selectable, realistic application states for visual or interaction review before production implementation.
---

# State prototyping

Build one editable working preview, grounded in the actual application when one exists. Apply review feedback directly to that preview. The user may call this preview “Before”; in this single-preview workflow that label means the current working review, not an unchanged historical baseline. For new UI, build the same single working preview without inventing an existing-app baseline. Prototype first: do not change production source to apply a proposal or make the preview work until the user approves application, unless production implementation was already explicitly authorized. By default, keep prototype files under `.state-prototype/<flow>/` in the workspace; honor an explicit user location or an existing suitable review surface. Report the location.

## Start with a few questions

Before exploring, ask the user once, in a single short message. Skip any question the request already answers or that you can answer by looking, and never block on an unanswered one: state your default and proceed.

- **Design references.** First look for a design system, `DESIGN.md`, tokens, Storybook or docs in the workspace. Ask only if you find none, or find several that conflict. Offer to use a path or link the user gives you.
- **Helper skills.** Say which optional skills from the [skill catalog](references/skill-catalog.md) look relevant, and ask which to use. "None" is a valid answer.
- **Before and After.** For an existing UI, ask whether they want a frozen Before next to an editable After. Default to one editable preview. For new UI, ask only if they have specific versions to compare.

1. **Explore before designing.** For existing UI, inspect the running app where feasible, its relevant screens, design system, components, state owners, callbacks and error/recovery paths. Trace important dependencies through to network, native and persistence boundaries. For new UI, inspect any existing design system and integration contracts, then distinguish requested behavior from design assumptions. Build an evidence-based state inventory before selecting fixtures. Read [exploration and verification](references/exploration-and-verification.md) for the inventory and checks.
2. **Import the actual product UI.** For existing UI, import the production screen, layout, views, dialogs, popovers, controls, styles and tokens. Replace only live data and side effects with typed fixture inputs and local callbacks. Reusing buttons while recreating the surrounding screen is not sufficient. Trace nested containers before mounting; use explicit, prototype-scoped dependency adapters that render the actual child views. Do not duplicate markup, reimplement layouts from screenshots, or build lookalike dialog bodies as a shortcut. If a component cannot be isolated safely, mark that state unavailable and explain the exact boundary. Do not silently recreate it. Keep production source unchanged unless the user authorizes a narrowly scoped extraction. Record actual imports, fixture-owned controllers, proposed changes and unavailable behavior. For new UI, derive states from the requested behavior and identify design assumptions.
3. **Model the states.** Cover relevant real loading, empty, error, saving, stopped, success and conflict paths, plus explicitly labeled proposed states. Use fictional deterministic fixtures, in-memory callbacks and stable held-pending samples. Preserve real validation, disabled actions, retained drafts, conflict and recovery semantics. Do not make live calls, invoke native operations, access credentials or persist data. Clearly expose unavailable actions; never fabricate a provider response or successful operation.
4. **Build the review surface.** Use the [review shell](references/review-shell.md) as the default layout. Put searchable, grouped state buttons in a left sidebar with a visible selection, area counts and reset. Do not use dropdowns for Area, State or Substate selection. Put labeled Width and Theme button groups in a top bar, with Compare when explicitly requested. Show the selected state, description, previous/next controls, fixture details and Copy link above the preview. When reviewing changes, also show locked areas, changed-state markers and a "What changed" panel (see below). Keep these review controls outside isolated app documents so dialogs retain genuine focus trapping while the reviewer can change or reset the fixture. The skill does not assume a framework. A React starter is supplied as one option; for any other stack, build the same layout and behavior with that stack's own tools.
5. **Inspect without collecting screenshots.** Run the prototype locally and check representative states, widths, themes, keyboard/focus and interactions in the live preview. Prefer DOM, computed-style and behavior checks. Do not capture, save or attach screenshots or screenshot galleries unless the user explicitly requests them. Do not generate bulky evidence directories or full per-state logs by default; report concise check results and material limitations. Check the invariants in the reference. Browser fixtures do not verify native, live or persisted behavior. After approved changes are applied and parity verified, remove only obsolete prototype files created for those changes; preserve unrelated fixtures and user files.

## Comparison only when requested

Keep the default review to one editable preview. Add before/after comparison only when the user chose it in the opening questions or asks for it later; never add it unasked. Feedback edits stay in the working preview and do not create an After branch.

When comparison is chosen, mount the unchanged production views as **Before** and the editable proposal as **After**. Freeze Before at the agreed starting point. If a historical baseline is needed, recover its actual source; do not approximate it with recreated markup. Keep shared production components in After and scope proposed overrides or component changes to the prototype. Put a **Compare** control in the top bar with **Before only**, **After only**, and **Side by side** modes. Keep Area, State and relevant Substate in the left sidebar and Theme and Width in the top bar. Use matching state, theme and width selections across both views where applicable, and identify states that exist only in the proposal. Keep review controls outside isolated app documents so modal focus behavior remains genuine and each preview stays operable.

In comparison mode, Before means the frozen baseline and After means the editable proposal. Explain this distinction if “Before” previously named the single working preview. For new UI, compare only user-specified versions or an agreed starting design; never present an invented prior application as an existing baseline.

For a concrete example of these decisions, read the [worked example](references/worked-example.md); adapt its approach, not its domain, fixture count or layout details.

## Iterate by area: show what changed, lock what is approved

When the user reviews area by area, work through the inventory one area at a time. For each area:

1. Inspect its states.
2. Critique the main surfaces first, then dialogs, then error and edge states. Don't spend a pass only on edge states while the main view is unchanged.
3. Implement, verify, and report a short Before/After/Why table.
4. Ask whether to lock or keep refining, and stop.

**What changed:**

- Keep the record in one small notes module beside the inventory: `lockedAreas`, `stateNotes[stateId]`, `areaNotes[areaId]` and `sharedNotes`. Each entry is one short line saying what renders differently and, where useful, why.
- The review shell reads that module. Changed states get a sidebar marker with a hover tooltip, and a "What changed" panel above the preview lists the selected state's entries plus area and shared ones.
- Keep a running Before/After/Why log in the prototype's coverage document.
- Update the notes in the same change as the code. Describe what actually renders, never intent. Correct or remove entries when a change is reverted.

**Locks:**

- When the user says to lock an area, add it to `lockedAreas` and record the lock in the coverage document. The shell shows a lock chip on that area and in its "What changed" panel.
- A locked area is frozen. Don't change it unless the user reopens it, even through a shared stylesheet or a new general rule. Scope new styles so they can't leak into locked areas.
- If a new rule would affect a locked area, say so and ask before applying it. Record a requested change to a locked area as a reopen-and-relock in the coverage document.
- When every area is locked, run the full render check once more and record the result.

## Preserve the chosen product direction

The review shell and the product being reviewed are separate designs. Liking the shell does not authorize a product redesign. When the user prefers the existing layout, keep its information architecture, navigation and primary workflow. Refine the existing controls, hierarchy, feedback and motion in the editable preview. In comparison mode, keep Before frozen and revise After. If a broader proposal is rejected, replace it with refinements grounded in Before; do not keep the rejected structure under new styling. Preserve a recoverable copy when replacing substantial prototype work.

## Relevant skills

The [skill catalog](references/skill-catalog.md) is a list of suggestions, not requirements. Use only the skills the user chose in the opening questions, or none. Read each chosen skill before using it; do not claim an unavailable or unread skill was applied. If a chosen skill is missing, offer to install it and ask first; do not silently install or guess its source. Continue independent work where possible. These skills do not authorize an unrelated redesign.

When proposing error and pending patterns, consider the user's preference for a toast plus a minimal indicator for action errors, with inline validation or a blocking load treatment where appropriate. Put action spinners inside their buttons and keep button geometry stable. Treat these as review criteria, not universal replacements for actual app behavior or task-specific requirements.
