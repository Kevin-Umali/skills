# Worked example: billing settings

A small, invented example of the whole workflow. The domain, state names and counts are placeholders. Take the method, not the details.

## The request

"Prototype the billing settings screen of our app so we can review it before we change anything."

The app already exists. It loads the plan from a backend, lets the user change the card, and shows an invoice list.

## 1. Explore

Read the real screen and trace where its data and side effects come from:

| Piece | Owner | Boundary |
| --- | --- | --- |
| Plan and invoices | `useBilling()` hook | Network request |
| Card form | `CardDialog` | Payment provider SDK |
| Invoice PDF download | `InvoiceRow` | Native file save |

## 2. Inventory the states

Group states by area. Each has a stable ID.

| Area | State ID | What it shows |
| --- | --- | --- |
| Page | `page-loading` | Request in flight, held pending |
| Page | `page-error` | Load failed, retry offered |
| Page | `page-empty` | New account, no invoices |
| Card | `card-dialog-open` | Dialog with an empty form |
| Card | `card-declined` | Provider rejected the card, draft kept |
| Card | `card-saving` | Submit pending, button spinner, geometry stable |
| Invoices | `invoices-list` | Normal list |
| Invoices | `invoices-download-unavailable` | Native save is not available in a browser |

Only branches that change what the user sees get their own state. Derive the real list from the app, not from this table.

## 3. Build the preview

- Import the real `BillingPage`, `CardDialog` and `InvoiceRow`, their styles and tokens.
- Replace only the data and side effects: a fixture-owned `useBilling()` that returns fictional, deterministic data, and in-memory callbacks.
- `page-loading` and `card-saving` stay pending until the reviewer picks another state. No request is made.
- Submitting a card in `card-declined` keeps the typed draft and shows the decline message, as the real screen does.
- `invoices-download-unavailable` says plainly that the native save is not available here. It does not pretend a file was saved.

## 4. Review surface

Use the [review shell](review-shell.md): states grouped by area in the sidebar, Width and Theme in the top bar, selected-state context row above the preview. The shell sits outside the app's iframe, so the card dialog keeps real focus trapping.

## 5. Iterate

The reviewer works area by area. After the Card area is changed and approved, it goes into `lockedAreas`, and later shared style changes must not touch it without asking. Each change is one line in the notes module, for example:

```ts
states: { 'card-declined': ['Decline message moves under the card number field.'] }
```

## 6. Report

State what was checked and what was not:

- Checked: every state above at Desktop and Phone widths, light and dark themes, keyboard focus in the dialog.
- Not verified: the payment provider SDK, the native file save and real network behavior. The browser fixtures do not cover them.
- Production source was not changed.
