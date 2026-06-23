# PhonePe Autopay (Recurring Donations) — Implementation Plan

**Project:** Selfless Sewa NGO website
**Feature:** Monthly recurring donations via PhonePe Autopay (UPI mandate)
**Date:** 14 June 2026
**Decisions locked in:**
- Database: **Vercel Postgres / Supabase (SQL)**
- Mandate type: **Fixed monthly amount** (`amountType: FIXED`, `frequency: MONTHLY`)
- This document is a plan only — no code is written yet.

---

## 1. Why this is bigger than the current one-time flow

Today the site does **one-time donations only**. The browser calls `/api/pay`,
the user pays, and the job is done — nothing needs to be remembered afterward.

A recurring donation is fundamentally different:

- The donor approves a **mandate once**, then the NGO's server must **charge it
  every month for months/years**, without the donor being present.
- That means the system must **store** each subscription and **run on a
  schedule** to collect each payment.

Two facts drive the whole plan:

1. **A database is required.** The site has none today. (Chosen: Vercel
   Postgres / Supabase.)
2. **A new PhonePe platform is required.** Autopay runs on PhonePe's **Standard
   Checkout v2** APIs, which use **OAuth tokens** — different from the old
   salt-key (`X-VERIFY`) method the current `/api/pay` and `helper.ts` use.

---

## 2. How PhonePe Autopay works (the model we're building to)

### Authentication (new)
- Endpoint (prod): `POST https://api.phonepe.com/apis/identity-manager/v1/oauth/token`
- Endpoint (sandbox): `POST https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token`
- Body: `client_id`, `client_secret`, `client_version`, `grant_type=client_credentials`
- Returns `access_token` + `expires_at` (epoch seconds).
- Used as header `Authorization: O-Bearer <access_token>` on all later calls.
- Token must be **cached and refreshed** before expiry.

### Phase 1 — Set up the mandate (donor present, one time)
1. `POST /subscriptions/v2/setup` — create the subscription with:
   - `merchantOrderId` (our unique id for this setup)
   - `merchantSubscriptionId` (our unique id for the subscription itself)
   - `amount` / `maxAmount`
   - `paymentFlow.type = SUBSCRIPTION_SETUP`
   - `paymentFlow.frequency = MONTHLY`
   - `paymentFlow.amountType = FIXED`
   - `paymentFlow.authWorkflowType` (TRANSACTION or PENNY_DROP)
   - `expireAt` (mandate validity)
2. Redirect donor to the returned PhonePe URL to approve the UPI mandate.
3. Confirm with `GET /subscriptions/v2/order/{merchantOrderId}/status`.
4. Confirm mandate is ACTIVE: `GET /subscriptions/v2/{merchantSubscriptionId}/status`.

### Phase 2 — Collect each monthly donation (automatic, donor absent)
Run by our **scheduler**, once per cycle, per active subscription:
1. **Notify** (24–48h before the debit): `POST /subscriptions/v2/notify`
   → returns a `notificationId`.
2. **Redeem** (actually debit): `POST /subscriptions/v2/redeem` using the
   `notificationId`.
3. **Verify**: check order status; mark success/failure in our database.

### Lifecycle controls
- **Cancel:** `POST /subscriptions/v2/{merchantSubscriptionId}/cancel`
- **Webhook:** PhonePe calls our endpoint asynchronously with status updates for
  setup, notify, and redeem events.

---

## 3. Database design (SQL)

Two tables.

### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | internal id |
| merchant_subscription_id | text unique | our id sent to PhonePe |
| phonepe_subscription_id | text | returned by PhonePe |
| donor_name | text | |
| donor_contact | text | |
| donor_pan | text | for 80G receipt |
| donor_address | text | |
| amount | integer | rupees, fixed monthly |
| status | text | PENDING / ACTIVE / PAUSED / CANCELLED / FAILED |
| frequency | text | MONTHLY |
| next_charge_at | timestamptz | when the next notify/redeem runs |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `redemptions` (one row per monthly charge attempt)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| subscription_id | uuid (FK) | → subscriptions.id |
| merchant_order_id | text unique | our id for this charge |
| notification_id | text | from notify call |
| amount | integer | |
| state | text | NOTIFIED / SUCCESS / FAILED |
| receipt_issued | boolean | for 80G receipt tracking |
| attempted_at | timestamptz | |
| completed_at | timestamptz | |

> **Privacy note:** storing PAN/contact/address makes this personal data. Access
> must be restricted, and we should plan a retention/cleanup policy. This ties
> into the privacy items in `SECURITY-ISSUES-FOR-CLIENT.md`.

---

## 4. New files & changes (mapped to the codebase)

### New backend helper
- **`src/phonepe.ts`** — OAuth token fetch + cache, and typed wrappers for
  setup / notify / redeem / status / cancel. Replaces salt-key logic for v2
  calls. Reads `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET` from env.

### New database helper
- **`src/db.ts`** — connection + query helpers for the two tables.

### New API routes (under `src/app/api/`)
| Route | Method | Job |
|-------|--------|-----|
| `subscription/setup/route.ts` | POST | Create mandate, store row, return PhonePe redirect URL |
| `subscription/status/route.ts` | GET | Check a subscription's status |
| `subscription/cancel/route.ts` | POST | Cancel a donor's mandate |
| `cron/charge/route.ts` | GET | Scheduler target: find due subscriptions → notify/redeem |
| `phonepe/webhook/route.ts` | POST | Receive async PhonePe callbacks, update DB |

### Scheduler
- **`vercel.json`** — add a `crons` entry pointing at `/api/cron/charge`
  (e.g. daily), which processes all subscriptions whose `next_charge_at` is due.
  Protect the route with a secret so only Vercel can trigger it.

### Frontend
- **`src/app/donate/page.tsx`** — add a "Donate once / Donate monthly" toggle.
  Monthly path calls `/api/subscription/setup`.
- **`src/stores/donationStore.ts`** — add `isRecurring` state.
- **New `src/app/manage-donation/page.tsx`** (optional) — let a donor look up
  and cancel their monthly donation.

### Receipts
- Extend the existing receipt logic in `src/app/api/receipt/route.ts` so each
  successful monthly redemption can produce its own 80G receipt.

---

## 5. Environment variables to add

```
PHONEPE_CLIENT_ID        = <from PhonePe>
PHONEPE_CLIENT_SECRET    = <from PhonePe>
PHONEPE_CLIENT_VERSION   = 1
PHONEPE_ENV              = SANDBOX | PRODUCTION
DATABASE_URL             = <Vercel Postgres / Supabase connection string>
CRON_SECRET              = <random string to protect the cron route>
```

> **Do not hardcode any of these in the source** — this is exactly issue #1 in
> the security review. The existing salt key should be moved to env as part of
> this work too.

---

## 6. Suggested build order (all in sandbox first)

1. **Provision the database** (Vercel Postgres/Supabase) + create the two tables.
2. **Build `src/phonepe.ts`** — OAuth token + setup call; test against sandbox.
3. **Build `/api/subscription/setup`** + DB write; do one manual mandate end-to-end.
4. **Build `/api/phonepe/webhook`**; verify status updates land in the DB.
5. **Build the cron route** (notify → redeem) and wire `vercel.json` cron;
   test a forced charge in sandbox.
6. **Build cancel** route + donor-facing UI.
7. **Add the "monthly" toggle** to the donate page.
8. **Per-cycle receipts.**
9. **Full sandbox test pass**, then switch env to PRODUCTION with live credentials.

---

## 7. Open questions / things to confirm with PhonePe

- Is the **Autopay/Subscription product enabled** on your PhonePe merchant
  account? It is often a separate activation from standard payments.
- Will PhonePe issue **new `client_id`/`client_secret`** (v2) for this, or do we
  reuse existing credentials?
- Preferred **mandate verification** method: `TRANSACTION` (₹1-type check) vs
  `PENNY_DROP`.
- Desired **mandate validity period** (`expireAt`) — e.g. 1 year, then renew?
- Confirm the **webhook URL** and the username/password PhonePe uses to sign
  webhook calls.

---

## 8. What I need to start building

Once you confirm:
- the database is provisioned (or you want me to script the schema), and
- Autopay is enabled on the PhonePe account with sandbox credentials,

I'll begin at step 2 above (the `phonepe.ts` helper) and work through the list,
testing each piece in sandbox before moving on.

*This plan deliberately reuses your existing patterns (Next.js App Router API
routes, the receipt/PDF flow, the Zustand store) so the new feature fits the
current codebase rather than replacing it.*

---

# Add-on: Auto-archive every receipt to Google Drive + a Sheet ledger

**Goal:** Whenever a payment is confirmed, the server automatically (a) uploads a
PDF receipt to a Google **Drive** folder you own, and (b) appends a row to a
Google **Sheet** that acts as a running donation ledger.

**Decisions locked in:**
- Store **both**: PDF receipts in Drive **and** a Google Sheet ledger.
- Archive **all confirmed payments** (not just ones where the donor asked for a
  receipt). Payments without donor details are logged with amount + txn id only.

## A1. Two realities that shape this

1. **"Google Docs" really means Google Drive + Google Sheets.** A PDF receipt is
   a file in Drive; the ledger is a Sheet. There are no editable "Docs" here.

2. **Auth on a personal Gmail must use OAuth, not a service account.** Because
   `thakurashutosh042003@gmail.com` is a consumer Gmail (not Workspace), a
   service account can't upload into your Drive (no storage quota for service
   accounts on consumer accounts). The reliable approach:
   - Create a Google Cloud project, enable the **Drive API** and **Sheets API**.
   - Create an **OAuth client**; you authorize the app **once**.
   - We capture a **refresh token** and store it securely (env/DB).
   - The server uses that refresh token forever after to upload files and append
     rows — all owned by you, counting against your storage.

## A2. The trigger must move server-side

Today a receipt PDF is only built when the donor clicks **Download**
(`payment-status/page.tsx` → `/api/receipt`). For *every* payment to be archived,
PDF generation must happen **the moment payment status becomes `COMPLETED`**,
regardless of whether the donor downloads it.

- Refactor the `generatePdf(...)` logic in `src/app/api/receipt/route.ts` into a
  **reusable function** (e.g. `src/receipt.ts → buildReceiptPdf(...)`).
- Call it from the **webhook / status-confirmation step** (one-time payments) and
  from the **redeem step** of the cron (recurring payments).

## A3. New work items

| # | Item | Notes |
|---|------|-------|
| G1 | Google Cloud project + Drive API + Sheets API enabled | One-time setup |
| G2 | OAuth client + one-time consent to capture **refresh token** | Owner authorizes once |
| G3 | `src/google.ts` helper | Auth (refresh token → access token), `uploadPdfToDrive()`, `appendLedgerRow()` |
| G4 | Refactor receipt into `src/receipt.ts` (`buildReceiptPdf`) | Shared by download + archive |
| G5 | Hook archival into payment confirmation | One-time: webhook/status; recurring: redeem step |
| G6 | Store Drive file link + ledger status in DB | Add columns (below) |
| G7 | Pre-create the target Drive folder + Sheet | IDs go into env |

## A4. Ledger (Google Sheet) columns

| Date | Donor name | Contact | PAN | Amount (₹) | Txn ID | Type | Receipt PDF link |
|------|-----------|---------|-----|-----------|--------|------|------------------|
| auto | or "—" | or "—" | or "—" | | | one-time / monthly | Drive link |

## A5. Database additions

Add to the donation/`redemptions` records:
- `drive_file_id` (text) — uploaded PDF's Drive id
- `drive_file_link` (text) — shareable link
- `ledger_appended` (boolean) — whether the Sheet row was written
- `archive_error` (text, nullable) — so a failed upload can be retried, not lost

## A6. Environment variables to add

```
GOOGLE_CLIENT_ID          = <OAuth client id>
GOOGLE_CLIENT_SECRET      = <OAuth client secret>
GOOGLE_REFRESH_TOKEN      = <captured once during authorization>
GOOGLE_DRIVE_FOLDER_ID    = <id of the Drive folder receipts go into>
GOOGLE_SHEET_ID           = <id of the ledger spreadsheet>
```

> Same rule as everywhere else: these live in environment variables, never in
> source code.

## A7. Failure handling (important)

Archiving must **never block or fail the donor's payment**. If Drive/Sheets is
down:
- the payment still succeeds and the donor still gets their receipt;
- the failure is recorded (`archive_error`) and **retried later** by the cron.

This keeps Google's availability separate from your donation flow.

## A8. Libraries

Add `googleapis` (official Google Node client) to `package.json`. It handles
OAuth refresh, Drive upload, and Sheets append.

## A9. What I need from you to build this

- Confirm you'll create the **Google Cloud project / OAuth client** (I can give
  step-by-step), or want me to document those exact console steps.
- The **Drive folder** and **Sheet** created (or I script their creation on first
  run).
- You complete the **one-time OAuth consent** so we can capture the refresh token.

