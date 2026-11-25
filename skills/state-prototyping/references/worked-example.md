# Worked example: billing page

Invented, to show the method.

**Request:** "Prototype the billing page before we change it: a quieter plan card, a compact Save button, the card error inline." React, Vite and Tailwind with a token file. `BillingPage` calls `useBilling()` itself.

## States

| Area | State | Shows |
| --- | --- | --- |
| Page | `page-loading`, `page-error`, `page-default`, `page-no-invoices` | Load pending, failure with retry, normal, empty list |
| Card | `card-declined`, `card-saving` | Decline with draft kept, submit pending |

## Build

- `init-prototype .state-prototype/billing --stack react --states states.json`.
- **Before** renders production `BillingPage`. `STUBS` maps `src/billing/useBilling.ts` to a fixture hook.
- **After:** `mirror-file.mjs` copies `Button.tsx` (shared: an `sm` size) and `BillingPage.tsx` (now the container, `hook: 'useBilling'`), and `--new` starts `BillingView.tsx` (the markup, taking a view model). The After frame renders `BillingView` with the fixture's view model.
- Classes come from the theme (`text-sm`, `bg-ink`), never raw values.

```js
// spec.js
export const values = [
  { area: 'card', selector: '#save-card', expected: { height: '36px', 'font-size': '14px', 'line-height': '20px' } },
  { area: 'card', selector: '#card-error', expected: { color: '#b42318' }, states: ['card-declined'], themes: ['light'] },
];
```

`measure-prototype --mode values` first fails with `line-height 24px, expected 20px` (a raw size class kept the old line height); `text-sm` fixes it. Card locks.

## Apply

`check-prototype` reports `Button.tsx` stale, so the production change is merged into the mirror. Moves: Button, then BillingView, then BillingPage; `main.tsx` is unchanged. Before drops its stub and renders the moved `BillingView` with the same view model as After. Parity shows one failure, a class lost in a merge, fixed in production. Then `mirror/` and the fixtures are deleted.

**Report:** all states at four widths and both themes, values and parity passing. Not verified: the payment provider and real network.
