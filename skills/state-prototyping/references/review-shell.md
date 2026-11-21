# Build the review shell

Use the controls described here as the default. They are framework-independent: the layout and behavior below apply to any stack. These are tools for the reviewer, separate from the product UI. Adapt the title, fixtures, font and theme tokens without changing the control placement unless requested.

## Layout

- Use a full-height shell with a left sidebar around 252 px wide and a flexible main area. The sidebar contains the title and revision, search, a separately scrolling state list, then a pinned count and Reset state button.
- Group state buttons by area. Each group has a heading button, count and expanded indicator. Keep all groups expanded initially. State rows use a quiet selected fill, stronger text and a small marker. Use `aria-current` and visible keyboard focus. Long labels wrap.
- Search across area names, state names, IDs and descriptions. Filter immediately, expose matches inside collapsed groups, and show a useful empty result. Selecting a result opens that fixture directly. Do not add an Apply button or use a dropdown for any state selector.
- Keep a full-width top bar above the preview. Arrange labeled segmented button groups in this order: Compare when requested, Width, Theme. Use visible pressed states. Default widths are Fit, Desktop 1100 px, Tablet 768 px, Phone 390 px and 320 px. Match the application's actual supported themes. Groups wrap when space is limited.
- Below the top bar, show the selected state name, index/total and one-line description. Put Previous, Next, Fixture details and Copy link alongside them. Details reveal the stable ID, source owner and fixture limitations.
- Put framed previews below this context row. Each frame has a small heading and a fidelity label. Use a quiet neutral ground, fine borders, compact type and restrained shadows. Keep review controls visually secondary to the product.
- Keep reset and selection reachable during loading, errors and modal fixtures. Isolate previews in same-origin iframe documents when feasible. Preserve dialog focus traps inside them. Do not put the outer controls inside the product's modal tree.
- Fixed-width previews may scroll within the preview stage. Fit uses the available stage width. Set the iframe viewport, not a scaled screenshot, so media queries and pointer targets behave normally. Frame borders may add a small outer width.

## What changed and locks

Show review status in the shell so the reviewer never has to ask what a state or area contains.

- **Sidebar markers:**
  - An area the user has locked shows a small lock chip beside its name: a quiet success tint, an icon and the word "Locked".
  - Each state row has a marker: filled when the state has its own change, hollow when only area-wide changes apply, and empty when only shared styling applies.
  - The row's `title` tooltip lists its changes as bullet lines.
  - A screen-reader-only ", changed in After" keeps the marker accessible.
  - A one-line legend above the sidebar footer explains the markers and the lock.
- **"What changed" panel:**
  - Sits below the selected-state context row and above the preview.
  - Lists the state's own changes, then its area's, with a collapsible "Shared across every state" list.
  - Shows the lock chip when the area is locked.
  - Keep it compact (capped height, two columns on wide stages) so it never pushes the preview off screen.
- **Data:** pass a notes module (`lockedAreas`, `states`, `areas`, `shared`) to the shell. Never hard-code notes in the shell. Notes describe rendered differences in plain words.
- **Locked means frozen.** The shell only displays status. The rules for locking are in the skill workflow.

## State and navigation

Use a small registry with stable IDs, area, label, description, owner and boundary. Derive the list and navigation from the same registry. Add visible substate buttons only for meaningful branches. Derive the inventory from the actual app; do not copy the example's fixture count.

State selection updates the context row and preview immediately. Previous/Next moves through the registry, expands the selected area and scrolls its button into view without moving keyboard focus. Reset discards local edits and restores the selected fixture. State changes and reset should not animate.

Encode the state, theme, width and comparison mode in the review URL. Reload and Copy link restore those selections. Do not encode private input, credentials or fixture edits. Explain any substate that the URL does not preserve. Validate frame navigation messages by origin, sending window, message type and registry ID.

Use one working preview by default. Only a chosen comparison enables Before only, After only and Side by side. In comparison mode, synchronize selected fixture, theme and viewport width. Let local edits remain independent. Before imports the unchanged product views; After is editable. A recreated product layout is not a valid baseline.

## Starters

The sections above are the spec. A starter is an optional shortcut that implements it. Only a React starter exists today. For Vue, Svelte, Solid, web components or plain HTML, implement the spec directly with that stack, or add a new `assets/review-shell/<stack>/` folder.

### React

Copy these assets into the prototype directory, not production source:

- [ReviewShell.tsx](../assets/review-shell/react/ReviewShell.tsx)
- [review-shell.css](../assets/review-shell/react/review-shell.css)

They use React and plain CSS with no UI library dependency. The CSS is scoped to review classes. Adapt the shell's neutral tokens and font to the host. The component deliberately does not mount product views, load data, mock native APIs or impose a product layout.

```tsx
import { ReviewShell } from './ReviewShell';

<ReviewShell
  title="Account settings"
  revision="1"
  areas={areas}
  states={states}
  comparison={comparisonRequested}
  frameUrl={({ variant, stateId, theme, reset }) =>
    `/?${new URLSearchParams({
      frame: variant, state: stateId, theme, reset: String(reset),
    })}`
  }
  coverageUrl="/coverage.md"
  changes={{
    lockedAreas: ['card'],
    shared: ['Buttons give a subtle press response.'],
    areas: { card: ['Dialog fields share one consistent width.'] },
    states: { 'card-declined': ['Decline message sits under the card number field.'] },
  }}
/>
```

`changes` is optional. Without it, the shell shows no markers, legend or panel.

The application entry point handles `frame=working`, `frame=before` or `frame=after` separately, applies the theme, looks up the fixture and mounts it behind an error boundary. It must not render the shell recursively inside a frame. A fixture can navigate the outer registry with:

```ts
window.parent.postMessage(
  { type: 'prototype:select-state', id: nextStateId },
  window.location.origin,
);
```

Use trusted same-origin preview URLs. Keep native operations, provider calls and persistence behind explicit fixture boundaries. The shell does not provide isolation for those operations.

The outer review shell is reusable prototype code. Its iframe contents must import the actual product views for existing UI. Do not use the shell's portability as a reason to recreate the product inside it.

For other frameworks, port this control structure and behavior rather than adding React. Do not copy example data, production imports, design proposals or source paths into unrelated prototypes.

## Verify the review controls

Check selecting a state by button and by search, no matches, collapsed-group search, Reset state, Previous/Next, a deep-link reload and clipboard failure. When `changes` is set, check the lock chip, all three marker kinds, the tooltip text and the "What changed" panel for a changed, an area-only and an unchanged state. In comparison mode, check all three modes and synchronized state/theme/width changes. Confirm that a modal cannot obscure the outer controls. Check visible keyboard focus and that a narrow product viewport changes actual layout. Keep render coverage separate from interaction coverage.

Use the live preview and concise DOM/interaction results. Do not capture or store screenshot evidence unless the user explicitly requests it.
