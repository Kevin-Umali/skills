# Apply after approval

Move only what was approved. Stop and ask if a step fails.

1. **Stale mirrors.** `check-prototype` lists them in `staleMirrors`: merge the production change into the mirror copy, update `base`, rerun values. Never move a stale file over newer code.
2. **Move** each `spec.moves` entry from `from` to `to`: tokens, shared, views, then containers. Build and type-check after each kind.
3. **Containers** build the view model from their `hook`. If one is a new file, wire it where production rendered the old view.
4. **Repoint Before.** It now renders the moved view with the same fixture view model as After. Drop its `STUBS` entries and repoint any import whose path changed.
5. **Parity.** `measure-prototype <dir> --mode parity`. Fix each failure in production, or add it to `spec.differences` with a why if production keeps it on purpose. Repeat until clean.
6. **Clean up.** Delete `mirror/` and the fixtures. Keep the rest only if the user wants it.

Report the moves, the parity result, each kept difference and what parity can't prove (live data, network, native, storage).
