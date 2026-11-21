# Exploration and verification

## Explore and inventory

Start with the actual screen and user flow, including dialogs, narrow layouts and existing interaction feedback when feasible. Inspect the relevant components, styles, state owners, reducers/hooks and service or native boundaries. Trace what each action does, what it disables, what survives failure, and which error is recoverable. If the running app cannot be inspected safely, import its actual view source and disclose missing visual verification. Do not substitute a recreated screen.

Create a compact coverage map suitable for the task. For each meaningful state or branch, record:

- Area, user-visible state and trigger; whether it is existing, proposed or unsupported.
- Production owner and view, data inputs, action callbacks, transition and recovery behavior.
- Loading/pending and error treatment, validation, retained drafts or prior data, conflicts and reset behavior.
- Dependencies on network, native capabilities, credentials or persistence, and the safe local boundary or reason the state cannot be represented.

Select fixtures for distinct user-visible behaviors, not every combination of booleans. Include secondary selectors only where they reveal meaningful branches. Keep samples stable and resettable; use local controllers and isolated dependency injection, avoiding global mocks that could hide unintended calls. For existing UI, verify the import chain includes actual product layouts and dialog contents, not only shared primitives. Record data/controller substitutions and unavailable behavior. For new UI, record the design assumptions and requested behavior instead of claiming existing-app parity.

A view may derive its prop type from a hook that invokes native or remote services. Reuse the view's type contract without calling that hook; provide a local controller and the actual form/provider primitives it expects. Check mount effects, invalidation/refetch and error callbacks as well as submit handlers. Source-only exploration is appropriate when live interaction is prohibited or unsafe; record the missing visual reference rather than treating it as a reason to bypass that boundary.

If a production view imports bound child containers, use an explicit prototype-only dependency mapping for those containers. Each adapter supplies fixture inputs to the real child view. Keep the mapping auditable and restricted to the prototype build. Do not globally replace APIs with successful responses or duplicate the child markup. If a safe seam requires production changes, explain the exact extraction needed and continue with the isolatable states while awaiting any required authorization.

## Review checklist

Verify observable behavior, not merely the existence of controls:

- [ ] Existing product screens and dialog contents are imported from production source. Fixture code supplies data and callbacks, not recreated UI. Unavailable states name the isolation boundary. Proposed behavior is identifiable and production files remain unchanged without authorization.
- [ ] The default review has one editable working preview, including when labeled Before; feedback updates it directly. Only an explicit comparison request adds a frozen Before baseline, editable After proposal and top-bar Compare modes: Before only, After only, Side by side. Verify the frozen view remains unchanged and both views use the intended state, theme and width.
- [ ] State selection and reset restore the intended fixture; held pending can be exited. Direct links or identifiers resolve to the intended state, with any unencoded substate disclosed.
- [ ] The review uses searchable area-grouped state buttons with a visible current selection, not dropdowns. Search reveals matching states in collapsed groups, handles no results and does not change the fixture until selection. Previous/Next and deep-link reload preserve the intended selection. Width, Theme and optional Compare remain visible above the isolated preview.
- [ ] Exercise representative success, failure, conflict and retry paths. Failures retain the correct input or prior data; validation and disabled actions match their source behavior. Unsupported actions disclose their boundary instead of pretending to succeed.
- [ ] No unexpected requests, native operations or persistent writes occur during the exercised flows. Check the browser console and network where feasible; describe what was actually observed.
- [ ] Test modal open, keyboard focus, Escape/close and return of focus, including a route back to review controls. Check representative widths, both available themes, overflow and focus visibility; resize the browser itself when viewport media queries matter.
- [ ] No screenshot evidence or bulky generated reports are produced unless explicitly requested. Report representative browser/DOM/interaction checks and limitations concisely. Do not claim all combinations or live/native fidelity from fixture checks.
