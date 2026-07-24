# Project Context & Handover

_Last updated: 2026-07-21. Covers the work done across the PhonePe Autopay →
production hardening → content/UI → Google Analytics arc, plus a map of which
external service runs on which account._

This is a running context file for whoever picks up the project next (or for the
founder handover). It does **not** contain secrets — real values live in
`.env.local` (gitignored) and in Vercel → Settings → Environment Variables.

---

## 1. Stack at a glance

| Layer | Tech |
|---|---|
| Framework | Next.js 14.2.4 (App Router, TypeScript) |
| Hosting | Vercel (Hobby plan) |
| Database | Neon Postgres (`donations`, `subscriptions`, `redemptions`) |
| Payments | PhonePe Standard Checkout **v2 (OAuth)** — one-time **and** recurring |
| CMS | Contentful (headless) |
| Receipts | PDF generated in-app, archived to Google Drive via a Google Apps Script Web App |
| Analytics | Google Analytics 4 (client tracking) + GA4 Data API (admin dashboard) |

---

## 2. Accounts — which service uses which login

> **The important bit.** Google services are split across two Gmail accounts on
> purpose; don't mix them up.

| Service | Account / owner | Notes |
|---|---|---|
| **Google Analytics 4 property** | **founderssngo@gmail.com** (the founder) | Owns the GA4 property. Measurement ID `G-RJT1QWHE1E`, numeric Property ID `546247258`. This is where the traffic data lives. |
| **Google Cloud (GCP) service account** for the GA4 Data API | **selflesssewa account** (`ssngo-analytics` project) | Service account `ssngo-analytics@ssngo-analytics.iam.gserviceaccount.com`. Created here because the founder's Google **Workspace org** blocks service-account key creation (`iam.disableServiceAccountKeyCreation`, "Secure by Default"). A plain Gmail has no org, so key download works. The service account is added as **Viewer** on the founder's GA4 property — cross-account access is fine. |
| **Google Drive receipt archiving** (Apps Script Web App) | **selflesssewango@gmail.com** | Receipts (one-time + recurring) are pushed to this account's Drive. Configured via `GOOGLE_APPS_SCRIPT_URL` + `GOOGLE_APPS_SCRIPT_SECRET`. |
| **PhonePe merchant** | Merchant ID `M22GE2J7US8VN` | v2 OAuth creds (`client_id` / `client_secret`). Separate **SANDBOX** and **PRODUCTION** credentials. Webhook Basic-auth set in the PhonePe dashboard must match `PHONEPE_WEBHOOK_USERNAME/PASSWORD`. |
| **Neon Postgres** | Neon project owner (dev's Neon account) | Pooled `DATABASE_URL` for the app/cron; direct `DATABASE_URL_UNPOOLED` for migrations. |
| **Contentful** | Currently the **developer's** Contentful account (space `x99unwq4ld3d`) | **Pending handover** to the founder's Contentful account (export/import via CLI, then repoint `CONTENTFUL_*`). |
| **Vercel** | GitHub org `selflesssewa` | Hobby plan. Production deploys from `main`. |
| **GitHub** | `github.com/selflesssewa/selfless-sewa-ngo` | Default branch `main`; feature work on `feat/autopay`. |

### Vercel Hobby constraints (learned the hard way)
- **Commit author:** production deploys are blocked unless the commit is authored
  by **founderssngo@gmail.com**. (Feature-branch pushes by the dev are fine; the
  block bites on `main`.)
- **Crons:** Hobby allows **daily** schedules only. All jobs are consolidated into
  one daily cron — see §4.
- **Function duration:** 60s max (`maxDuration` capped accordingly).
- `vercel.json` has `git.deploymentEnabled: true` (a stray `false` once disabled
  auto-deploy — keep it `true`).

---

## 3. Environment variables

Full template with comments: [`.env.example`](../.env.example). Names only here.

| Var | Purpose | Account |
|---|---|---|
| `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN` | CMS content | Contentful (dev's, → founder) |
| `JWT_SECRET` | signs payment-flow tokens | app |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Postgres (pooled / direct) | Neon |
| `ADMIN_KEY` | gate for `/admin` + admin APIs | app |
| `CRON_SECRET` | protects `/api/cron/*` (Vercel sends automatically) | app |
| `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_SECRET` | Drive receipt archiving | selflesssewango@gmail.com |
| `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_ENV` | v2 OAuth (one-time + autopay) | PhonePe merchant |
| `PHONEPE_WEBHOOK_USERNAME`, `PHONEPE_WEBHOOK_PASSWORD` | webhook Basic-auth (PROD; fail-closed) | PhonePe dashboard |
| `SITE_URL` | PhonePe redirect-back target | — (use the **www** host in prod) |
| `NEXT_PUBLIC_GA_ID` | GA4 client tracking (`G-RJT1QWHE1E`) | founder's GA4 |
| `GA4_PROPERTY_ID` | numeric property ID `546247258` (NOT `G-…`) | founder's GA4 |
| `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY` | service-account creds for Data API | GCP (selflesssewa) |

> The old v1 salt-key vars (`PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`,
> `PHONEPE_SALT_INDEX`) are **deprecated** — one-time payments moved to v2 OAuth.
> Safe to leave blank.

---

## 4. What was built / changed this session

### PhonePe Autopay (recurring donations) — full pipeline
- **Setup** via `SUBSCRIPTION_CHECKOUT_SETUP` with `authWorkflowType: TRANSACTION`
  (debits the first installment at authorization). Code in `src/phonepe.ts`,
  route `src/app/api/subscription/setup/route.ts`.
- **Webhook** (`src/app/webhook/phonepe/route.ts`): handles the subscription
  lifecycle (active/pause/cancel), records charges, and finalizes one-time orders.
- **Receipts + Drive archiving**, **retry cron**, and read-only diagnostics
  (`scripts/e2e-autopay.mjs`, `scripts/check-pending.mjs`).
- Tables: `subscriptions` with `charges_count`, `failed_count`,
  `total_collected`, `archive_pending`.

### One-time payments migrated to PhonePe v2 OAuth
- Was v1 (salt-key); the merchant only had v2 credentials. `createPayment` and
  `callStatusApi` in `src/phonepe.ts` now use v2 OAuth (same creds as autopay).

### Admin dashboard (`src/app/admin/page.tsx`)
- **Three tabs:** One-time · Recurring · **Analytics** (new — see below).
- Summary cards (total raised, one-time this month, recurring/month (MRR),
  active recurring, pending).
- **Needs-attention** panel (failed charges, receipts not yet in Drive,
  one-time payments stuck pending > 1 day).
- Filters (search / status / receipt / month / day), CSV export for both
  one-time and recurring, and **cancel-mandate** action.

### Google Drive archiving hardening
- Near-instant archiving via `@vercel/functions` `waitUntil` (fire-and-forget
  that still completes on serverless), `maxDuration = 60`.
- **Atomic claim** to prevent duplicate receipts: `drive_file_id` sentinel
  (`ARCHIVE_PENDING`) so two invocations can't both upload
  (`claimDonationForArchive` / `claimRedemptionForArchive` in `src/db.ts`).

### Cron consolidation (`src/app/api/cron/daily/route.ts`)
- One daily job (04:00) runs charge + reconcile + archive + reconcile-receipts,
  because Hobby only allows daily crons. `vercel.json` schedule `0 4 * * *`.

### Webhook hardening
- `isAuthentic()` verifies `SHA256(username:password)` (fail-closed in
  PRODUCTION), parses the real nested payload (`payload.state`), handles
  subscription cancel/pause, and finalizes one-time orders as a fallback.

### Production bugs fixed
- **Mandate setup failing** (`INVALID_SUBSCRIPTION_EXPIRY`): `expireAt` must be
  epoch **milliseconds**, not seconds. Sandbox didn't validate this.
- **Webhook never firing:** the registered URL was the non-www host, which
  308-redirects to www; PhonePe doesn't follow redirects. Fix: register the
  **`https://www.selflesssewango.com/api/webhook/phonepe`** URL in the PhonePe
  dashboard.
- **Receipt timestamps in UTC:** Vercel runs UTC; receipts now format in
  `Asia/Kolkata` using the real payment timestamp (`src/receipt.ts`).
- **Stuck-pending donations:** donors closed the tab before redirect and no
  reconcile cron was live yet. Running reconcile finalized them; the daily cron
  now prevents recurrence.

### Content & CMS
- Contentful edits (team swaps, campaign active toggles, map cities, homepage
  featured campaign) + **ISR** (`export const revalidate = 60`) so content
  edits appear without a redeploy.
- Campaigns sorted **active-first** dynamically (`src/dao.tsx`).

### Homepage India map (`src/app/components/Map.tsx`)
- Rewritten: whole-India geoMercator, pulsing beacons, reach arcs (traveling
  lights), scroll-in reveal, and **pan/zoom controls** (+/−/Reset; wheel-zoom
  disabled).

### Hero slider
- Image sizes reduced (`h-[48vh]` / `40vh` / `36vh`).

### Google Analytics 4
- **Client tracking:** `@next/third-parties` `GoogleAnalytics` in
  `src/app/layout.tsx` (gated on `NEXT_PUBLIC_GA_ID`); a `track()` helper
  (`src/analytics.ts`) and `DonateLink` wrapper fire events:
  `donate_cta_click` (with a `location` param per button), `begin_checkout`,
  `purchase`, `donation_failed`.
- **Admin Analytics tab (native, founder-friendly):**
  - `src/ga.ts` — GA4 **Data API** report runner (9 parallel `runReport`
    queries), 10-minute in-memory cache, returns `{ configured:false }` if creds
    are unset (so the UI shows a friendly "not connected" state).
  - `src/app/api/admin/analytics/route.ts` — admin-gated, `?days=7|30|90`.
  - `src/app/components/AnalyticsPanel.tsx` — plain-language sections: at-a-glance,
    donation journey/funnel, which Donate button gets clicked, sources, top
    pages, cities, phone-vs-computer.
  - **Verified pulling live data** locally (61 visitors/30d) on 2026-07-21.

---

## 5. Deployment notes
- Production = `main`. Feature work lands on `feat/autopay`, then PR → `main`.
- Env var changes require a **redeploy** to take effect.
- After any PhonePe env/URL change, re-check the **www** webhook URL in the
  PhonePe dashboard.

Related docs in this folder: [`DEPLOYMENT.md`](DEPLOYMENT.md),
[`AUTOPAY_DESIGN.md`](AUTOPAY_DESIGN.md),
[`RECEIPT_DRIVE_ARCHIVE.md`](RECEIPT_DRIVE_ARCHIVE.md),
[`DONOR_LEDGER.md`](DONOR_LEDGER.md).

---

## 6. Outstanding / TODO
- [ ] Add `NEXT_PUBLIC_GA_ID`, `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`,
      `GA4_PRIVATE_KEY` to **Vercel (Production)** and redeploy.
- [ ] Merge `feat/autopay` → `main` to ship the Analytics tab + GA tracking.
- [ ] **Rotate the GA4 service-account key** (the private key was pasted into a
      chat once): create a new JSON, update Vercel + `.env.local`, delete the old.
- [ ] **Contentful ownership handover** to the founder's account (CLI
      export from `x99unwq4ld3d` → import → repoint `CONTENTFUL_*`).
- [ ] Content tasks: add **Bag Distribution** to `misc.campaigns`; swap homepage
      `campaignImages` to Bag Distribution photos; add photos to the Chaach
      campaign; update map to Delhi / Gurugram / Chandigarh / Dehradun / Noida
      (create the Noida location entry).
