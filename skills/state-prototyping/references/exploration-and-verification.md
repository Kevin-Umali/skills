# Exploration and verification

## Explore and inventory

Start from the actual screen and flow, including dialogs, narrow layouts and existing feedback. Read the components, styles, state owners, reducers and hooks, and service or native boundaries. Trace what each action does, disables, keeps on failure, and which errors are recoverable. If the running app cannot be inspected safely, import its real view source and disclose the missing visual check. Never substitute a recreated screen.

Make a compact coverage map. For each meaningful state or branch record:

- Area, user-visible state and trigger; existing, proposed or unsupported.
- Production owner and view, data inputs, callbacks, transitions and recovery.
- Pending and error treatment, validation, kept drafts or prior data, conflicts, reset.
- Network, native, credential or persistence dependencies, and the safe local boundary or why the state cannot be shown.

Pick fixtures for distinct user-visible behaviors, not every boolean combination, and add secondary selectors only for meaningful branches. Keep samples stable and resettable. Use local controllers and scoped dependency injection, never global mocks that could hide unintended calls. For existing UI, confirm the import chain reaches the real layouts and dialog contents, not just shared primitives. Record substitutions and unavailable behavior. For new UI, record design assumptions instead of claiming parity.

- A view may take its prop type from a hook that calls native or remote services. Reuse the type contract without calling the hook, and supply a local controller plus the form and provider primitives it expects. Check mount effects, refetch and error callbacks as well as submit.
- Source-only exploration is fine when live interaction is unsafe. Record the missing visual reference instead of bypassing the boundary.
- If a view imports bound child containers, map them in a prototype-only, auditable adapter that feeds fixtures to the real child view. Never replace APIs globally with success responses or duplicate child markup. If a safe seam needs production changes, state the exact extraction and continue with the isolatable states while awaiting authorization.

## Checklist

Verify observable behavior, not just that controls exist.

- [ ] Product screens and dialog contents come from production source. Fixtures supply data and callbacks only. Unavailable states name their boundary. Proposed behavior is identifiable. Production files are unchanged without authorization.
- [ ] One editable working preview by default, including when labeled Before. A chosen comparison adds a frozen Before, an editable After and the Compare modes. Before stays unchanged, and both use the intended state, theme and width.
- [ ] State selection and reset restore the intended fixture, and held pending can be exited. Links resolve to the right state, with unencoded substates disclosed.
- [ ] Searchable, area-grouped state buttons with a visible selection, no dropdowns. Search reveals matches in collapsed groups, handles no results, and changes nothing until selection. Previous, Next and deep-link reload keep the selection.
- [ ] Success, failure, conflict and retry paths work. Failures keep the right input or prior data. Validation and disabled actions match the source. Unsupported actions disclose their boundary.
- [ ] No unexpected requests, native operations or persistent writes. Check console and network where feasible and describe what you saw.
- [ ] Modal open, keyboard focus, Escape and focus return, including a way back to the controls. Representative widths, both themes, overflow, focus visibility. Resize the browser itself when viewport media queries matter.
- [ ] No screenshots or bulky reports unless asked. Report concise checks and limits, and never claim all combinations or live and native fidelity from fixtures.
