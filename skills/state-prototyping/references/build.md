# Build

## Layout

```text
.state-prototype/<flow>/
  states.js       registry: { id, area, label, description, owner, boundary, limits, fixture }
  spec.js         numbers and moves (below)
  notes.js        highlights only: what changed and why, no numbers
  before/frame.*  production view + fixture view model (React: frame.tsx)
  after/frame.*   mirror view + the same view model
  mirror/         changed project files at their project paths
  shell/          the review UI: open shell/index.html
  vite.config.mjs Vite projects: the project's config plus the mirror plugin
```

Frames read `?state`, `?theme` and `?reset`. Serve from the project root (`npx vite --config <dir>/vite.config.mjs`, or `python3 -m http.server`); `measure-prototype` serves the prototype itself.

## Before

Import the production view unchanged and pass it fixture data. If the view calls its own data hook, map that hook to a fixture module in `STUBS` in `vite.config.mjs`; nothing else changes. Without Vite, use a prototype-only adapter. Never mock APIs globally.

## After: production code in mirror/

Start each changed file with `mirror-file.mjs` (`--new` for a file production doesn't have); it prints the move for `spec.js`.

- **Project conventions.** Its styling system, tokens, scale, shared controls and folder names. If the project writes `text-sm`, write `text-sm`, not `font-size: 14px`.
- **No patches.** No source rewrites, override CSS, `!important`, variant selectors, or checks for which frame is showing. `check-prototype` errors on them.
- **Production imports.** `import { Button } from '@/components/Button'`, never a path into the prototype. The mirror plugin resolves imports from mirror files to the mirror copy when one exists, else production. If an unchanged module imports a mirrored one and the After needs the new version through it, mirror that module too.
- **Data as props.** Views take a view model and callbacks, with no fetching. To split a view that fetches, keep its file as the container (a `container` move with its `hook`, so callers don't change) and move the markup to a new view file. Frames never render containers.
- **Pairing.** Keep ids and structure from Before so elements pair in the highlights and parity.
- **Foundations first.** A new token or shared component goes in the mirror copy of its file before views use it.
- **Tooling.** If the styling system scans sources, add `mirror/` in After-only CSS (Tailwind v4: `@source "../mirror";`). To type-check, use a prototype tsconfig whose `paths` list the mirror first (`"@/*": ["<dir>/mirror/src/*", "src/*"]`).

## spec.js

| Export | Entry |
| --- | --- |
| `values` | `{ area, selector, expected: { property: value }, states?, themes? }`. What the After must render. |
| `differences` | `{ selector, props?, why }`. What production keeps different after shipping. |
| `moves` | `{ from: 'mirror/<path>', to: '<path>', kind, base?, hook? }`. `kind` is `token`, `shared`, `view` or `container`. |

Write values as rendered CSS (`14px`, `600`, `#21201c`), not token names, so a wrong class or missing font fails. Prefer ids over positional selectors. Colors usually need `themes`.

## Measure

- `--mode values`: the After renders every matching value and its fonts load. Reading class names is not enough.
- `--mode parity`: Before and After differ only where `differences` allows. Failures are grouped per element.

One run by hand: `measure.html?mode=values&state=<id>&theme=light&width=1100`; the page title becomes `measure:pass` or `measure:fail`.

The shell itself is tested; read [shell-spec](shell-spec.md) only to change it.
