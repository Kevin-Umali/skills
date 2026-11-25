# Explore and verify

## Explore

Start from the running screen, including dialogs, narrow layouts and existing feedback. Read the components, styles, state owners and hooks, and trace what each action does, disables and keeps on failure. If the app can't be run safely, read its view source and say the visual check is missing.

List each state that matters, with:

- area, what the user sees and what triggers it; existing or proposed;
- production owner, data inputs, callbacks and recovery;
- pending and error handling, validation, kept drafts;
- the network, native or storage boundary and how the prototype stands in for it.

One state per user-visible branch, not per boolean combination. A view that imports bound child containers gets a prototype-only adapter that feeds fixtures to the real child. If a clean seam needs a production change, name it and carry on with the states you can isolate.

## Verify

Check behavior, not just that controls exist.

- [ ] Before imports production unchanged and nothing from `mirror/`. Fixtures supply data and callbacks only.
- [ ] Each changed file is in `mirror/` at its project path, in the project's conventions, with production imports and no patches. Views take a view model; new tokens and shared components exist before use.
- [ ] Every number is in `spec.js`, none in `notes.js`; every mirror file has a move. `check-prototype` shows no errors or stale mirrors.
- [ ] `measure-prototype --mode values` passes for each locked area.
- [ ] Each state renders its fixture; reset and deep links land on the right state; held pending can be exited.
- [ ] Success, failure, conflict and retry work. Failures keep the input. Validation and disabled actions match production.
- [ ] No unexpected requests, console errors or storage writes.
- [ ] Keyboard focus, Escape and focus return in dialogs; both themes; no overflow at narrow widths.
- [ ] With highlights, every change has a reason.

Report briefly what you checked and its limits. Fixtures never prove live, native or persisted behavior.
