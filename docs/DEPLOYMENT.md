# Deployment Guide (Vercel)

How to deploy the donations app to production. For local/sandbox testing see
[TESTING.md](./TESTING.md).

Both one-time and recurring payments run on **PhonePe v2 OAuth** — one set of
credentials (`PHONEPE_CLIENT_ID` / `PHONEPE_CLIENT_SECRET`) powers everything.

---

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Set these in the **Production** scope.

### Must differ from your local/sandbox values

| Variable | Production value | Why |
|----------|------------------|-----|
| `PHONEPE_ENV` | `PRODUCTION` | Switches to live PhonePe (not sandbox) |
| `PHONEPE_CLIENT_ID` | **production** OAuth client id | Sandbox creds won't authenticate live |
| `PHONEPE_CLIENT_SECRET` | **production** OAuth client secret | 〃 |
| `SITE_URL` | `https://selflesssewango.com` | PhonePe redirect-back must hit the live domain |
| `DATABASE_URL` | production Neon pooled URL | Live donor data |

### Secrets — generate strong values

| Variable | How to set |
|----------|-----------|
| `JWT_SECRET` | `openssl rand -hex 32` |
| `CRON_SECRET` | `openssl rand -hex 32` (Vercel auto-sends this as the cron `Authorization` bearer) |
| `ADMIN_KEY` | strong password — gates `/admin` |
| `GOOGLE_APPS_SCRIPT_SECRET` | the secret your Apps Script checks |

### Carry over from local (same value)

| Variable | Value |
|----------|-------|
| `PHONEPE_CLIENT_VERSION` | `1` |
| `GOOGLE_APPS_SCRIPT_URL` | NGO Drive Apps Script Web App URL |
| `CONTENTFUL_SPACE_ID` | Contentful space id |
| `CONTENTFUL_ACCESS_TOKEN` | Contentful delivery token |

### Copy-paste checklist (names only)

```
PHONEPE_ENV
PHONEPE_CLIENT_ID
PHONEPE_CLIENT_SECRET
PHONEPE_CLIENT_VERSION
SITE_URL
DATABASE_URL
JWT_SECRET
CRON_SECRET
ADMIN_KEY
GOOGLE_APPS_SCRIPT_URL
GOOGLE_APPS_SCRIPT_SECRET
CONTENTFUL_SPACE_ID
CONTENTFUL_ACCESS_TOKEN
```

### Not needed / deprecated

- `DATABASE_URL_UNPOOLED` — only used by `npm run db:migrate`. Not required on
  Vercel runtime; run migrations from your machine (see step 2).
- `PHONEPE_MERCHANT_ID` / `PHONEPE_SALT_KEY` / `PHONEPE_SALT_INDEX` — **removed**
  (old v1 salt-key auth). Do not add.
- `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD` — **required in
  production** (the webhook fails closed without them). Set the same pair here
  and in the PhonePe dashboard. See step 4.

---

## 2. Run the database migration (once)

The app needs the `donations`, `subscriptions`, and `redemptions` tables. Run
the migration from your machine against the **production** database:

```bash
DATABASE_URL_UNPOOLED="<prod-direct-url>" npm run db:migrate
```

(Use the **direct/unpooled** Neon URL for DDL.) The schema is idempotent
(`CREATE TABLE IF NOT EXISTS`), so it's safe to re-run.

---

## 3. Cron jobs

The **Vercel Hobby plan only allows daily cron jobs** (and a small number of
them), so all maintenance runs in **one daily cron** that does every sweep in
sequence:

| Path | Schedule | Does |
|------|----------|------|
| `/api/cron/daily` | daily 04:00 | charge due mandates → reconcile pending one-time → retry one-time archiving → retry recurring receipt archiving |

Protected by `CRON_SECRET` (Vercel sends it automatically). The granular
endpoints (`/api/cron/charge`, `/reconcile`, `/archive`, `/reconcile-receipts`)
still exist for **manual** triggering, but aren't scheduled.

> On the **Pro** plan you could split these back into separate, more frequent
> crons — but daily is plenty for an NGO's volume.

---

## 4. PhonePe production setup

- Activate **production** OAuth credentials for **both** PG Checkout (one-time)
  and **Autopay** (recurring).
- Register the webhook URL `https://selflesssewango.com/api/webhook/phonepe` in
  the PhonePe dashboard, with a username + password.
- **Webhook verification IS implemented.** The route checks
  `Authorization: SHA256(username:password)` against
  `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD`. You **must** set these
  (same values in the dashboard and in Vercel) — in `PRODUCTION` the route
  **rejects** webhooks if they're unset (fail-closed). In `SANDBOX` they're
  optional (so local testing can POST freely).
- Confirm the first-charge behaviour with one small real mandate: the setup
  transaction (authWorkflowType `TRANSACTION`) debits the first installment, and
  the app records that setup order as the first charge (it does **not** debit
  again).

---

## 5. Safe rollout (production deploys from `main`)

All payment work lives on `feat/autopay`; production deploys from `main`. The
code now needs the **v2 OAuth** env vars, so the code and its environment must go
live together. Recommended sequence:

### 5a. Test the production *build* on a Vercel Preview (no real money)

A Preview runs the exact prod build, but pointed at **sandbox PhonePe + a
throwaway database** — catching build/env problems before they touch `main`.

```bash
vercel            # creates a Preview deployment (not --prod)
```

(`vercel.json` has `git.deploymentEnabled: false`, so git pushes don't
auto-deploy — the CLI does it regardless.)

Set **Preview-scoped** env vars: `PHONEPE_ENV=SANDBOX` + sandbox creds, a
**separate** `DATABASE_URL` (see 5b), `SITE_URL` = the preview URL, plus the
other secrets. Then run the full flow (one-time + recurring + `/admin`) on the
preview URL.

### 5b. Use a separate database for testing ⚠️

Do **not** point Preview at the production DB. Create a **Neon branch** off prod
(Neon → Branches → New branch) — instant copy, separate URL — and use it for the
Preview's `DATABASE_URL`. Discard it afterwards.

### 5c. Prepare production (while `main` is still the old code)

1. Set **Production-scoped** env vars (section 1) — prod PhonePe creds,
   `PHONEPE_ENV=PRODUCTION`, live `SITE_URL`, prod `DATABASE_URL`, webhook
   username/password.
2. Run the migration against the prod DB (section 2).

### 5d. Merge & deploy

- Open a PR `feat/autopay → main` and merge.
- **Commit author:** on the Hobby plan the deploy only runs if the merge commit
  author maps to the project owner's GitHub identity — confirm this, or Vercel
  blocks the deploy.
- If git deployments are disabled, trigger prod manually: `vercel --prod`.

### 5e. Rollback plan

If prod misbehaves: Vercel → Deployments → the previous working deployment →
**Promote to Production**. Instant revert to the old `main`. Know where this is
before deploying.

---

## 6. Post-deploy smoke test

1. Make a small **one-time** donation on the live site → confirms PG Checkout +
   receipt archiving.
2. Set up a **recurring** mandate → confirms Autopay + first-charge recording.
3. Open `/admin` with `ADMIN_KEY` → confirm both show up with correct totals.
4. Check Google Drive for the archived receipts.
