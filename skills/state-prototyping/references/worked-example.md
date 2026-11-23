# Worked example: billing settings

An invented example of the whole workflow. Take the method, not the details.

**Request:** "Prototype the billing settings screen so we can review it before changing anything." The app exists: it loads the plan from a backend, lets the user change the card, and lists invoices.

## 1. Explore

| Piece | Owner | Boundary |
| --- | --- | --- |
| Plan and invoices | `useBilling()` hook | Network |
| Card form | `CardDialog` | Payment provider SDK |
| Invoice PDF | `InvoiceRow` | Native file save |

## 2. Inventory

| Area | State id | Shows |
| --- | --- | --- |
| Page | `page-loading` | Request in flight, held pending |
| Page | `page-error` | Load failed, retry offered |
| Page | `page-empty` | New account, no invoices |
| Card | `card-dialog-open` | Empty form |
| Card | `card-declined` | Provider rejected the card, draft kept |
| Card | `card-saving` | Submit pending, spinner in the button, same size |
| Invoices | `invoices-list` | Normal list |
| Invoices | `invoices-download-unavailable` | Native save not available here |

One state per user-visible branch, not per boolean combination.

## 3. Build

- Import the real `BillingPage`, `CardDialog` and `InvoiceRow` with their styles and tokens.
- Fake only data and side effects: a fixture `useBilling()` with fictional deterministic data and in-memory callbacks.
- `page-loading` and `card-saving` stay pending, with no request.
- `card-declined` keeps the typed draft and shows the decline, as the real screen does.
- `invoices-download-unavailable` says the native save is unavailable and fakes no success.

## 4. Review

Run `init-prototype --states`, fill the fixtures and `notes.js`, run `check-prototype`. Choose Split with highlights. After the Card area is changed and approved, add it to `lockedAreas`.

An entry in the Changes inspector, with the agent's reason from `notes.js`:

```text
3  button #save
   height   48px → 36px
   background-color   #4338ca → #21201c
   Why: One black primary action says "do this next". Indigo had no brand behind it.
```

```js
{ selector: '#save', props: ['background-color'], why: 'One black primary action says "do this next".' }
```

## 5. Report

Checked: every state at Desktop and Phone widths, both themes, dialog keyboard focus. Not verified: the payment SDK, native file save, real network. Production source unchanged.
