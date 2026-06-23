# Selfless Sewa — Payment Feature Implementation Plan

**Status:** Draft for pitch / decision
**Date:** 17 June 2026
**Scope:** The two open payment issues —

- **Issue #13** — Capture donor name & contact when receipt is declined
- **Issue #9** — (A) Durable donor ledger + on-demand receipts, and (B) PhonePe Autopay (recurring donations)

> Issue #10 (migrate hosting to the NGO-owned Vercel account) is **done**, so cron jobs, environment variables, and secrets can now live on infrastructure the NGO controls. This plan assumes that.
>
> **Decision locked (June 2026):** autopay (#9B) is committed, so a **Neon Postgres** database has been provisioned and connected to the Vercel project (`DATABASE_URL` set on Production + Preview). Both #9A and #9B target this DB — no Google Sheets/Apps-Script layer. An optional owner-facing spreadsheet *export* can be added later if wanted.

---

## Table of contents

1. [How the system works today](#1-how-the-system-works-today)
2. [The central constraint: the app is stateless](#2-the-central-constraint-the-app-is-stateless)
3. [Cross-cutting prerequisites (do these first)](#3-cross-cutting-prerequisites-do-these-first)
4. [Issue #13 — Non-receipt donor capture](#4-issue-13--non-receipt-donor-capture)
5. [Issue #9 Part A — Donor ledger + on-demand receipts (Neon Postgres)](#5-issue-9-part-a--donor-ledger--on-demand-receipts-neon-postgres)
6. [Issue #9 Part B — Autopay (recurring donations)](#6-issue-9-part-b--autopay-recurring-donations)
7. [Environment variables (consolidated)](#7-environment-variables-consolidated)
8. [Security & PII handling](#8-security--pii-handling)
9. [Testing strategy](#9-testing-strategy)
10. [Recommended sequencing & effort](#10-recommended-sequencing--effort)
11. [Risks & open questions](#11-risks--open-questions)

---

## 1. How the system works today

| File | Role |
|------|------|
| [src/app/donate/page.tsx](../src/app/donate/page.tsx) | Donation form. Collects amount, optional receipt details (name/PAN/contact/address). Already has a **"Give once / Give recurring" toggle scaffolded as "coming soon."** |
| [src/stores/donationStore.ts](../src/stores/donationStore.ts) | Zustand store for form state. Already has `isRecurring` and `frequency` fields. |
| [src/app/api/pay/route.ts](../src/app/api/pay/route.ts) | Builds a signed JWT with the donation details, calls PhonePe `pay`, returns the redirect URL. |
| [src/app/api/status/route.ts](../src/app/api/status/route.ts) | Polls PhonePe transaction status (used by the client). |
| [src/app/api/receipt/route.ts](../src/app/api/receipt/route.ts) | Verifies the JWT, re-checks status, generates the receipt PDF on the fly with `pdf-lib`, streams it to the browser. |
| [src/app/payment-status/page.tsx](../src/app/payment-status/page.tsx) | Post-payment page. Polls status every 5s (max 5 tries), then offers a one-time receipt download. |
| [src/helper.ts](../src/helper.ts) | `callStatusApi()` — PhonePe status call + checksum. |

**Current end-to-end flow (one-time donation):**

```
Donor fills form
   │
   ▼
GET /api/pay?amount=…&name=…&pan=…&contact=…&address=…
   │  • mints JWT { id, a, [p, n, c, ad] }  (expires in 5 min)
   │  • POSTs to PhonePe /pg/v1/pay  (salt-key signed)
   ▼
Browser redirected to PhonePe checkout → donor pays
   │
   ▼
PhonePe redirects to https://selflesssewango.com/payment-status?t=<JWT>
   │  • client polls GET /api/status?t=<JWT>
   │  • on COMPLETED → offers "Download Receipt"
   ▼
GET /api/receipt?t=<JWT>  → PDF generated & downloaded once
```

Key implementation facts:

- PhonePe is the gateway. Credentials (`merchantId`, `saltKey`, `saltIndex`) are **hardcoded** in [src/app/api/pay/route.ts](../src/app/api/pay/route.ts) and [src/helper.ts](../src/helper.ts).
- The redirect URL is hardcoded to `https://selflesssewango.com/payment-status`.
- The legacy **`api.phonepe.com/apis/hermes`** endpoints with salt-key/`X-VERIFY` signing are used.

---

## 2. The central constraint: the app is stateless

There is **no database and no NGO-controlled storage**. A donation's whole record lives in a **JWT that expires in 5 minutes**, and the receipt PDF is generated on demand and downloaded once ("it will not be available later").

Consequences that directly drive these two issues:

- **The owner never receives a copy of anything.** The only durable record is the PhonePe dashboard (amount + txn id, plus mobile number once #13 ships).
- **Confirmation is client-only.** If the donor closes the tab after paying, nothing server-side ever learns the payment completed.
- **Recurring is impossible as-is.** A mandate lives for months; you must persist subscription IDs and schedules. A 5-minute JWT cannot do this.

So the three pieces sit on a spectrum:

| Feature | How much state it needs |
|---------|--------------------------|
| #13 non-receipt capture | **None** — stays stateless |
| #9A ledger / on-demand receipts | **Light** — a reliable server-side confirmation that writes each donation to the Neon DB |
| #9B autopay | **Heavy** — the same DB + a scheduler (cron) + the PhonePe Subscription APIs |

---

## 3. Cross-cutting prerequisites (do these first)

These unblock both issues and remove security smells before we build on top.

### 3.1 Move PhonePe credentials to environment variables

Currently hardcoded in two files. Before adding more endpoints/secrets:

- Add `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX`.
- Read them via the existing `getEnvVariable()` helper.
- Replace the literals in [src/app/api/pay/route.ts](../src/app/api/pay/route.ts) and [src/helper.ts](../src/helper.ts).
- **Rotate the salt key** in the PhonePe dashboard afterwards (the current one is in git history).

### 3.2 Centralise the PhonePe client

Create `src/phonepe.ts` to hold base URLs, salt-key signing, the `pay` call, the `status` call, and (later) the subscription/Autopay calls — which reuse the same signing. Today this logic is split across `pay/route.ts` and `helper.ts`. Consolidating now keeps #9 maintainable.

### 3.3 Persistence strategy — DECIDED

Autopay (#9B) is committed and a **Neon Postgres** database is already provisioned and connected to the Vercel project. So:

- **Neon Postgres is the single source of truth** for both the donor ledger (#9A) and subscriptions (#9B). No Google Sheets/Apps-Script layer.
- Connection: use the **pooled `DATABASE_URL`** (pgbouncer) for app routes and cron; use **`DATABASE_URL_UNPOOLED`** for one-off schema migrations.
- Note Neon free-tier compute **auto-suspends when idle** and cold-starts on the next query — fine at this scale; the daily cron's first query may be slightly slow.
- **Owner visibility:** delivered by a read-only admin view (and/or an optional scheduled export to a Google Sheet later, if the owner wants the spreadsheet feel).
- **Receipt PDFs are regenerated on demand** from the stored row (see §5) — no binary/file storage (Drive/Blob) needed.

---

## 4. Issue #13 — Non-receipt donor capture

**Goal:** when a donor unchecks "Would you like a receipt?", still collect **name (required), phone (required), email (optional)**, pass the phone to PhonePe (so they appear in the merchant dashboard), and embed the details in the JWT. **No database.**

### 4.1 Changes

**[src/stores/donationStore.ts](../src/stores/donationStore.ts)**

- Add `email: string` and `updateEmail(value)` to the store and to `resetStore()`.

**[src/app/donate/page.tsx](../src/app/donate/page.tsx)**

- When `!wantsReceipt`, render a section with **Full Name**, **Phone Number**, **Email (optional)**.
- In `handleSubmit`, validate name + phone are present for the non-receipt path:

  ```ts
  if (!wantsReceipt && (!name || !contact)) {
    alert("Please enter your name and phone number.");
    return;
  }
  ```

- Build the query for the non-receipt path with `{ name, contact, ...(email ? { email } : {}), amount }`.

**[src/app/api/pay/route.ts](../src/app/api/pay/route.ts)**

- Read `name`, `contact`, `email` for all flows; `pan`/`address` only for the receipt flow.
- JWT payload gains a third branch:
  - receipt: `{ id, a, p, n, c, ad }`
  - non-receipt with details: `{ id, a, n, c, [e] }`
  - fallback: `{ id, a }`
- Add `mobileNumber: contact` to the PhonePe `payload` whenever `contact` is present (covers both flows → donor shows in the dashboard).

### 4.2 Notes & guardrails

- **Receipt logic stays untouched.** [src/app/api/receipt/route.ts](../src/app/api/receipt/route.ts) only generates a PDF when `name && addr && contact && pan` are all present, so non-receipt donors never get a (blank) receipt.
- **`payment-status` "wants receipt" check** is `!!data.p` — non-receipt donors won't see the download button. Correct as-is.
- **Validation:** phone should be basic-sanity checked (10-digit Indian format). Email is optional but if present should be format-checked.

### 4.3 Effort

**~0.5 day.** Self-contained, no infra. Should ship first.

---

## 5. Issue #9 Part A — Donor ledger + on-demand receipts (Neon Postgres)

**Goal:** the NGO owner gets a durable, searchable record of **every** donation (receipt and anonymous) in the Neon database, and any receipt can be regenerated on demand from its stored row.

### 5.1 The reliability problem to solve

Today, confirmation only happens if the donor stays on `/payment-status`. For a financial ledger that's not acceptable — we need a record even when the donor closes the tab.

**Design: write twice + reconcile (to the DB).**

```
GET /api/pay
   │  ① INSERT a PENDING donations row (keyed by txnId) WITH all donor PII.
   │     Guarantees the owner sees every attempt and that PII is persisted.
   ▼
Donor pays on PhonePe
   │
   ├─(happy path)→ /payment-status loads (has JWT)
   │                 → POST /api/donations/confirm
   │                      • verifies status COMPLETED via PhonePe status API
   │                      • UPDATE row → COMPLETED + payment mode
   │
   └─(tab closed)→ Vercel Cron (daily) /api/cron/reconcile  (guarded by CRON_SECRET)
                     • scans PENDING rows older than ~15 min
                     • calls PhonePe status API by txnId
                     • finalises COMPLETED/FAILED
```

This makes the **client path an optimisation, not a dependency** — the PENDING row guarantees a record regardless.

**Receipts are regenerated on demand, not stored.** Every field the PDF needs already lives in the row, so [src/app/api/receipt/route.ts](../src/app/api/receipt/route.ts) can rebuild the PDF anytime. Benefits: no file storage (Drive/Blob) needed, and it fixes the current "receipt not available later" limitation — both donor *and* owner can re-download any receipt at any time.

> A PhonePe **server-to-server (S2S) callback** can augment the client path for near-real-time confirmation. Optional for #9A, **reused for #9B**, so we build the confirm endpoint to accept both.

### 5.2 Storage — Neon Postgres (decided, §3.3)

Source of truth is the provisioned Neon DB. A thin `src/db.ts` wraps the connection (pooled `DATABASE_URL`). **Owner visibility** is a read-only admin view over the table; an optional scheduled **export to a Google Sheet** can be layered on later if the owner prefers a spreadsheet — but it is no longer the system of record.

### 5.3 `donations` table

```sql
donations (
  txn_id          TEXT PRIMARY KEY,   -- merchantTransactionId
  created_at      TIMESTAMPTZ DEFAULT now(),
  type            TEXT,               -- one-time | recurring-charge
  amount_rupees   INTEGER,
  status          TEXT,               -- PENDING | COMPLETED | FAILED
  donor_name      TEXT,
  donor_phone     TEXT,
  donor_email     TEXT,
  pan             TEXT,               -- receipt flow only
  address         TEXT,               -- receipt flow only
  wants_receipt   BOOLEAN,
  payment_mode    TEXT,               -- from PhonePe status
  receipt_no      TEXT,
  subscription_id TEXT,               -- set for recurring charges (#9B)
  notes           TEXT                -- reconciliation / error detail
);
```

### 5.4 New/changed files

- `src/db.ts` — Neon client + query helpers (insert PENDING, finalise, fetch by txnId).
- `src/app/api/pay/route.ts` — after a successful `pay`, INSERT the PENDING row.
- `src/app/api/donations/confirm/route.ts` — finalise the row (called by client and/or S2S callback).
- `src/app/api/cron/reconcile/route.ts` — Vercel Cron fallback; guarded by `CRON_SECRET`.
- `vercel.json` — add the cron schedule (e.g. daily).
- Refactor PDF generation out of [src/app/api/receipt/route.ts](../src/app/api/receipt/route.ts) into `src/receipt.ts` so the on-demand download (and later the per-cycle recurring receipts) reuse it, sourcing data from the DB row.
- `src/app/admin/...` — minimal read-only ledger view (protected) for the owner.

### 5.5 Where this connects to #13

Once the ledger exists, the name/phone/email from #13 flow straight into the `donations` row — so #13's "make anonymous donors visible" goal is **fully delivered** by #9A. #13 alone only populates the PhonePe dashboard; #9A puts everyone in the NGO's own database.

### 5.6 Effort

**~3–4 days** — schema + `src/db.ts`, the PENDING-write, the confirm endpoint, the reconcile cron, the PDF refactor, and a minimal admin view.

---

## 6. Issue #9 Part B — Autopay (recurring donations)

**Goal:** donors set up a recurring (monthly/quarterly/half-yearly/yearly) donation via PhonePe Autopay (UPI mandate / card standing instruction). The system then charges them automatically and issues a receipt each cycle.

> ✅ **Confirmed by the PhonePe integrator (June 2026).** Autopay/Subscription uses the **same salt-key + `X-VERIFY` (SHA256) signing** as the existing one-time flow — **not** OAuth. It runs on a **separate subscription MID + salt key** (so we carry a second cred set, we do not replace the one-time MID). A **UAT Merchant Simulator + UAT keys are available now**, so integration can be built and tested immediately; going live then needs UAT→Production migration on the live subscription MID. Official docs are linked in §6.2.

### 6.1 Why this needs a database

Mandates are long-lived. We must persist:

- the mandate/subscription id and its status (active/paused/cancelled/expired),
- amount, frequency, next charge date,
- a log of each charge attempt (for idempotency, retries, and receipts).

A JWT cannot hold months of state. **This is the provisioned Neon Postgres DB** (same instance as the #9A `donations` table), accessed via `src/db.ts`.

**Proposed schema (alongside `donations` from §5.3):**

```sql
-- one row per donor mandate
subscriptions (
  id                TEXT PRIMARY KEY,      -- our id
  phonepe_sub_id    TEXT,                  -- PhonePe mandate/subscription id
  status            TEXT,                  -- PENDING_AUTH | ACTIVE | PAUSED | CANCELLED | EXPIRED | FAILED
  amount_rupees     INTEGER,
  frequency         TEXT,                  -- MONTHLY | QUARTERLY | HALFYEARLY | YEARLY
  donor_name        TEXT,
  donor_phone       TEXT,
  donor_email       TEXT,
  pan               TEXT,                  -- if they want 80G receipts
  address           TEXT,
  next_charge_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  cancel_token      TEXT                   -- unguessable token for the donor's cancel link
);

-- one row per charge attempt
redemptions (
  id                TEXT PRIMARY KEY,
  subscription_id   TEXT REFERENCES subscriptions(id),
  txn_id            TEXT,                  -- merchant transaction id for this charge
  status            TEXT,                  -- NOTIFIED | SUCCESS | FAILED | RETRYING
  amount_rupees     INTEGER,
  scheduled_for     TIMESTAMPTZ,
  charged_at        TIMESTAMPTZ,
  receipt_link      TEXT,
  error             TEXT
);
```

### 6.2 The PhonePe Subscription API set (official)

System flow: [`developer.phonepe.com/v1/docs/system-flow-recurring`](https://developer.phonepe.com/v1/docs/system-flow-recurring). All v1 endpoints, same salt-key/`X-VERIFY` signing as today.

| # | API | Used in | Reference |
|---|-----|---------|-----------|
| 1 | Create User Subscription | setup | `/v1/reference/create-user-subscription` |
| 2 | Submit AUTH Request | setup | `/v1/reference/submit-auth-request` |
| 3 | AUTH Request Status | setup | `/v1/reference/auth-request-status` |
| 4 | User Subscription Status | setup / monitoring | `/v1/reference/user-subscription-status` |
| 5 | Recurring INIT | each cycle (pre-debit notification) | `/v1/reference/recurring-init` |
| 6 | Recurring Debit Execute | each cycle (the actual debit) | `/v1/reference/recurring-debit-execute` |
| 7 | Recurring Debit Execute Status | each cycle | `/v1/reference/recurring-debit-execute-status` |
| 8 | Cancel Subscription | lifecycle (our action) | `/v1/reference/cancel-subscription` |
| 9 | Revoke / Pause / Unpause (S2S) | lifecycle (donor-initiated callbacks) | `/v1/reference/revoke-subscription`, `/v1/reference/pause-and-unpause-subscription` |

Testing: **UAT Merchant Simulator** ([`/v1/docs/autopay-uat-sandbox`](https://developer.phonepe.com/v1/docs/autopay-uat-sandbox)) maps each API to mock Success/Failure/Pending responses. Go-live: **UAT→Production migration** ([`/v1/docs/uat-to-production-migration-3`](https://developer.phonepe.com/v1/docs/uat-to-production-migration-3)). UAT credentials (subscription MID + salt key, index 1) are held in the integrator's email — kept out of this repo.

### 6.3 Two-phase model

**Phase 1 — Mandate setup (donor present):**

```
Donor toggles "Give recurring" + picks frequency (UI already scaffolded)
   ▼
POST /api/subscriptions/create
   • [1] Create User Subscription  (amount, frequency, mandate validity, max amount)
   • [2] Submit AUTH Request → redirect donor to authorise (UPI app / card)
   • insert subscriptions row (status PENDING_AUTH)
   ▼
PhonePe redirect/callback → [3] AUTH Request Status / [4] User Subscription Status
   • on success → mark subscription ACTIVE, set next_charge_at
```

**Phase 2 — Recurring execution (donor absent):**

```
Vercel Cron (daily) /api/cron/charge-subscriptions  (guarded by CRON_SECRET)
   • find ACTIVE subs where next_charge_at <= today
   • [5] Recurring INIT → pre-debit notification (UPI Autopay: ~24h before debit)
   • on debit day: [6] Recurring Debit Execute → insert redemption row
   • [7] Recurring Debit Execute Status → confirm the charge
   • on SUCCESS: insert a COMPLETED donations row (so the receipt regenerates
                 on demand), email the donor their receipt, advance next_charge_at
   • on FAILURE: mark redemption FAILED, apply retry policy, notify donor
```

**Idempotency is critical:** each redemption uses a deterministic key (e.g. `subId + period`) so a cron re-run never double-charges.

### 6.4 Lifecycle management

- **Cancel:** `/api/subscriptions/cancel` (API [8]) + a tokenised cancel link emailed to the donor (`cancel_token`); also surface in a simple "Manage your donation" page.
- **Donor-initiated revoke / pause / unpause:** donors can revoke or pause a UPI mandate in their bank app → handle PhonePe's **S2S callbacks** (API [9]) and update the sub status (CANCELLED / PAUSED).
- **Expiry / insufficient funds / paused** states, with owner visibility via the admin view over the DB.
- **Receipts without the donor present:** each cycle's receipt must be **emailed** (regenerated from its `donations` row), not download-only — this reuses #9A's receipt generator, so **#9B depends on #9A.**

### 6.5 New files (indicative)

- `src/phonepe.ts` — extend with the subscription/INIT/execute/cancel calls, reusing the existing salt-key `X-VERIFY` signing (no OAuth) against the separate subscription MID.
- `src/db.ts` — DB client + query helpers.
- `src/app/api/subscriptions/create/route.ts`
- `src/app/api/subscriptions/callback/route.ts` — AUTH result + revoke/pause/unpause S2S callbacks.
- `src/app/api/subscriptions/cancel/route.ts`
- `src/app/api/cron/charge-subscriptions/route.ts`
- `src/app/manage-donation/page.tsx` — donor self-service (cancel/view).
- `vercel.json` — second cron entry.
- Email sending (e.g. Resend/SMTP) for receipts + lifecycle notices.

### 6.6 Frontend

The toggle and frequency selector already exist as "coming soon" in [donate/page.tsx](../src/app/donate/page.tsx). Wiring = remove the "coming soon" guard, branch `handleSubmit` to `/api/subscriptions/create` when `isRecurring`, and add the manage/cancel page.

### 6.7 External dependencies (start early — they have lead time)

- **Enable Subscriptions on the live PhonePe merchant account** + obtain the **production subscription MID + salt key** (separate from the one-time MID). UAT keys are already in hand, so build/test is not blocked.
- ~~Provision the database~~ — **done:** Neon Postgres is connected (`DATABASE_URL` on Vercel).
- **Choose an email provider** for cycle receipts.

### 6.8 Effort

**~2–3 weeks** for a robust implementation (mandate lifecycle, cron, retries, receipts, donor self-service, testing in PhonePe UAT). This is the heavyweight; it should not start until #9A's confirmation + receipt-archive backbone exists.

---

## 7. Environment variables (consolidated)

| Variable | Used by | Phase |
|----------|---------|-------|
| `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN`, `JWT_SECRET` | existing | done |
| `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX` | move out of source | prereq |
| `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (migrations) | ledger + autopay | **done — Neon, on Vercel** |
| `CRON_SECRET` | protect cron routes | #9A |
| `PHONEPE_SUB_MERCHANT_ID`, `PHONEPE_SUB_SALT_KEY`, `PHONEPE_SUB_SALT_INDEX` | autopay (separate subscription MID, salt-key auth — not OAuth) | #9B |
| `EMAIL_API_KEY` (e.g. Resend) | cycle receipts | #9B |
| `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_SECRET` | *optional* Sheet export only | later |

All set in **Vercel → Settings → Environment Variables** (now on the NGO account).

---

## 8. Security & PII handling

- **PAN, phone, and address are sensitive PII.** They live in the Neon DB — keep the connection string secret, restrict the admin view behind auth, and consider masking PAN (store last 4) + a retention policy. If a Google Sheet export is added later, it must be access-restricted too.
- **`DATABASE_URL` is a secret** — Vercel-managed env var (marked Sensitive), never in the client bundle.
- **Cron routes** must reject requests without `CRON_SECRET`.
- **Rotate the PhonePe salt key** after moving it to env (it's in git history).
- **S2S callbacks** must be signature-verified before trusting them.
- **JWT** already signs donation data; keep expiry short and never trust client-supplied amounts at confirmation (re-read from PhonePe status).

---

## 9. Testing strategy

- **#13:** manual form testing (receipt vs non-receipt vs neither), validation, confirm `mobileNumber` reaches the PhonePe dashboard on a small live payment.
- **#9A:** small live payments — verify the PENDING row is inserted at pay time, flips to COMPLETED on the status page, and that the reconcile cron finalises a deliberately-abandoned (tab-closed) payment. Verify a receipt regenerates correctly on demand from the row and shows in the admin view.
- **#9B:** use the **PhonePe UAT Merchant Simulator** (Success/Failure/Pending templates) with the UAT subscription keys for the full lifecycle (Create Subscription → Submit AUTH → AUTH Status → Recurring INIT → Debit Execute → Execute Status → Cancel, plus revoke/pause/unpause S2S). Test cron idempotency (re-run same day = no double charge), failure/retry, and that each cycle emails + archives a receipt. Then UAT→Production migration and a small live mandate.

---

## 10. Recommended sequencing & effort

| Order | Work | Depends on | Effort |
|-------|------|-----------|--------|
| 0 | Move PhonePe creds to env + `src/phonepe.ts` (§3.1–3.2); rotate salt key; `src/db.ts` + run `donations` migration | #10, Neon (done) | ~1 day |
| 1 | **#13** non-receipt capture | 0 | ~0.5 day |
| 2 | **#9A** DB ledger (PENDING write + confirm + reconcile cron) + on-demand receipt + admin view | 0, 1 | ~3–4 days |
| 3 | **#9B** autopay (build/test on UAT now; live needs prod subscription MID) | 2, prod Subscriptions enablement | ~2–3 weeks |

**Why this order:** #13 is a quick, stateless win. #9A delivers the owner-visibility goal (and subsumes #13's visibility), and builds the reliable confirmation + receipt backbone on the DB. #9B is the big build and structurally **reuses** #9A's DB, confirm/reconcile logic, the receipt generator, and the S2S callback, so it goes last.

---

## 11. Risks & open questions

1. ~~Autopay timeline / storage choice~~ — **resolved:** autopay committed; Neon Postgres provisioned and is the source of truth for both #9A and #9B.
2. **Production Subscriptions enablement** — request Subscriptions + the **production** subscription MID/salt key on the live PhonePe account. (Long-pole; UAT is unblocked.)
3. ~~OAuth platform migration~~ — **resolved:** autopay uses the same salt-key auth as today on a separate subscription MID; no OAuth migration needed.
4. **Owner visibility format** — is a read-only admin view enough, or does the owner also want a Google Sheet export of the ledger?
5. **PAN/PII retention** — mask PAN (store last 4) and set a retention policy in the DB?
6. **Email provider** — which service for cycle receipts and lifecycle notices (Resend, SES, SMTP)?
7. **Donor self-service** — how rich does the "manage/cancel donation" page need to be for v1?

---

*Prepared as a pitch/decision document. No code has been changed by this plan; the recurring-donation UI currently shipped is a non-functional "coming soon" stub.*
