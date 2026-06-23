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
- `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD` — reserved for webhook
  Basic-auth. ⚠️ The webhook route does not verify them yet (see step 4).

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

`vercel.json` already declares the scheduled jobs — Vercel picks these up
automatically on deploy:

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/charge` | daily 04:00 | Charge due recurring mandates |
| `/api/cron/reconcile` | every 6h | Finalize one-time payments (closed tabs) |
| `/api/cron/archive` | every 6h | Retry one-time Drive archiving |
| `/api/cron/reconcile-receipts` | every 6h | Retry recurring receipt archiving |

They're protected by `CRON_SECRET`, which Vercel sends automatically.

---

## 4. PhonePe production setup

- Activate **production** OAuth credentials for **both** PG Checkout (one-time)
  and **Autopay** (recurring).
- Register the webhook URL `https://selflesssewango.com/api/webhook/phonepe` in
  the PhonePe dashboard.
- ⚠️ **Add webhook verification before relying on recurring in production.** The
  route currently trusts the payload. Configure `PHONEPE_WEBHOOK_USERNAME` /
  `PHONEPE_WEBHOOK_PASSWORD` in both the dashboard and Vercel, and verify the
  incoming Basic-auth header in `/api/webhook/phonepe`.
- Confirm the first-charge behaviour with one small real mandate: the setup
  transaction (authWorkflowType `TRANSACTION`) debits the first installment, and
  the app records that setup order as the first charge (it does **not** debit
  again).

---

## 5. Deploy

- Push the branch and deploy via Vercel (or merge to the deployed branch).
- **Commit author:** on the Hobby plan, the deploy only runs if the commit
  author maps to the project owner's GitHub identity — confirm this before
  expecting an auto-deploy.

---

## 6. Post-deploy smoke test

1. Make a small **one-time** donation on the live site → confirms PG Checkout +
   receipt archiving.
2. Set up a **recurring** mandate → confirms Autopay + first-charge recording.
3. Open `/admin` with `ADMIN_KEY` → confirm both show up with correct totals.
4. Check Google Drive for the archived receipts.
