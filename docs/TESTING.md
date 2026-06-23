# Testing Guide — Donations (one-time + recurring)

This is the end-to-end guide for running and testing the donation system locally
against the **PhonePe sandbox**, with no real money involved. It covers setup,
every environment variable, and step-by-step tests for one-time payments,
recurring (Autopay) mandates, receipts/Drive archiving, the admin dashboard, and
the background crons.

Both one-time and recurring payments run on **PhonePe Standard Checkout v2
(OAuth)** — a single set of credentials (`PHONEPE_CLIENT_ID` /
`PHONEPE_CLIENT_SECRET`) powers everything.

---

## 1. Prerequisites

- **Node.js** 18+ and npm
- A **Postgres** database (we use [Neon](https://neon.tech) — free tier is fine)
- **PhonePe sandbox** OAuth credentials (`client_id` / `client_secret`) from the
  PhonePe Business dashboard (Test/UAT mode)
- A **Google Apps Script** Web App for Drive uploads (optional — only needed to
  test receipt archiving; the rest works without it)

---

## 2. Setup

```bash
git clone <repo-url>
cd selfless-sewa-ngo
npm install
cp .env.example .env.local   # then fill in the values (see section 3)
npm run db:migrate           # applies db/schema.sql to your database
npm run dev                  # starts http://localhost:3000
```

---

## 3. Environment variables (`.env.local`)

| Variable | Required for | Notes |
|----------|--------------|-------|
| `DATABASE_URL` | everything | Pooled Postgres connection string |
| `DATABASE_URL_UNPOOLED` | `db:migrate` | Direct (unpooled) URL; falls back to `DATABASE_URL` |
| `JWT_SECRET` | payments | Any long random string (`openssl rand -hex 32`) |
| `SITE_URL` | payments | **`http://localhost:3000`** for local testing (controls the PhonePe redirect-back URL) |
| `PHONEPE_ENV` | payments | `SANDBOX` for testing, `PRODUCTION` for live |
| `PHONEPE_CLIENT_ID` | payments | v2 OAuth client id (one-time **and** recurring) |
| `PHONEPE_CLIENT_SECRET` | payments | v2 OAuth client secret |
| `PHONEPE_CLIENT_VERSION` | payments | Usually `1` |
| `CRON_SECRET` | crons | Bearer token guarding the cron endpoints |
| `ADMIN_KEY` | `/admin` | Password for the owner dashboard |
| `GOOGLE_APPS_SCRIPT_URL` | Drive archiving | Apps Script Web App URL |
| `GOOGLE_APPS_SCRIPT_SECRET` | Drive archiving | Shared secret the script checks |
| `CONTENTFUL_SPACE_ID` / `CONTENTFUL_ACCESS_TOKEN` | site content | CMS for the marketing pages |
| `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD` | prod webhook | Basic-auth pair you also set in the PhonePe dashboard |

> **Deprecated:** `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX`
> (old v1 salt-key auth) are no longer used and can be omitted.

A minimal `.env.local` for sandbox testing:

```
DATABASE_URL=postgres://...
JWT_SECRET=<random 32+ chars>
SITE_URL=http://localhost:3000
PHONEPE_ENV=SANDBOX
PHONEPE_CLIENT_ID=<sandbox client id>
PHONEPE_CLIENT_SECRET=<sandbox client secret>
PHONEPE_CLIENT_VERSION=1
CRON_SECRET=dev-cron-secret-change-me
ADMIN_KEY=<any password>
GOOGLE_APPS_SCRIPT_URL=<apps script url>      # optional
GOOGLE_APPS_SCRIPT_SECRET=<apps script secret> # optional
```

---

## 4. The PhonePe sandbox flow (how to "pay")

When you submit a donation you're redirected to the PhonePe **sandbox**. You will
NOT be charged. To simulate a result:

1. On the payment page choose any method (UPI / card / net banking), or
2. You'll reach a **"Simulate Payment Response"** screen → click **Success** →
   **Submit**.

PhonePe then redirects back to `http://localhost:3000/payment-status?...`.

> ✅ **Sanity check:** the success page's URL bar should say **localhost**. If it
> says `selflesssewango.com`, your `SITE_URL` isn't set to localhost.

---

## 5. Test: one-time donation

1. http://localhost:3000/donate → **Give once**
2. Enter an amount (e.g. ₹10).
3. **Without receipt:** fill Name + Phone (Email optional).
   **With receipt:** tick "Would you like a receipt?" and fill Name, PAN,
   Contact, Address.
4. Tick the acknowledgement → **Donate** → complete on the sandbox.
5. Back on `/payment-status` you should see **"Thank you for donating ₹10"**, a
   **Download Receipt** button (if you asked for one), and **Back to Home**.

**Verify in the database:**

```sql
SELECT txn_id, amount, status, donor_name, donor_contact, wants_receipt,
       payment_mode, drive_file_link
FROM donations ORDER BY created_at DESC LIMIT 1;
```

Expected: `status = COMPLETED`, donor details saved, and within a few seconds
`drive_file_link` populated (the owner's copy is archived to Drive automatically
right after confirmation).

---

## 6. Test: recurring donation (Autopay)

A recurring donation sets up a UPI mandate. Because the mandate uses
`authWorkflowType: TRANSACTION`, **PhonePe debits the first installment during
authorization** — so the setup transaction *is* the first charge. The app records
that setup order as the first `SUCCESS` charge (with receipt) and schedules the
next debit one month out. **No second debit, no manual webhook needed for the
first charge.**

1. http://localhost:3000/donate → **Give recurring** (frequency is Monthly).
2. Amount (e.g. ₹50), fill Name + Phone → acknowledge → **Donate**.
3. Authorize on the sandbox (**Success → Submit**).
4. Back on `/payment-status` you should see **"Your monthly donation of ₹50 is
   set up!"**

**Verify the mandate + first charge — with NO cron and NO webhook:**

```sql
SELECT s.donor_name, s.amount, s.status, s.next_charge_at,
       r.merchant_order_id, r.state, r.receipt_issued, r.drive_file_link
FROM subscriptions s
JOIN redemptions r ON r.subscription_id = s.id
ORDER BY r.attempted_at DESC LIMIT 1;
```

Expected immediately after authorizing:
- `subscriptions.status = ACTIVE`, `next_charge_at` ≈ one month out
- a `redemptions` row in state `SUCCESS` (keyed by the setup order id),
  `receipt_issued = true`, `drive_file_link` populated
- in the admin **Recurring** tab: Charges 1, Collected ₹50

> The **subsequent monthly** charges (section 7's charge cron) DO go through
> notify → redeem → webhook. Those still need the webhook to finalize (automatic
> in production; manual in sandbox — see section 7).

---

## 7. Test: the background crons

All cron endpoints require the `CRON_SECRET` bearer token. In production Vercel
calls these on a schedule (see [`vercel.json`](../vercel.json)); locally you
trigger them by hand.

```bash
# Charge any subscriptions whose next_charge_at is due
curl -H "Authorization: Bearer dev-cron-secret-change-me" \
  http://localhost:3000/api/cron/charge

# Reconcile one-time payments left PENDING (donor closed the tab)
curl -H "Authorization: Bearer dev-cron-secret-change-me" \
  http://localhost:3000/api/cron/reconcile

# Retry Drive archiving for one-time donations that didn't upload
curl -H "Authorization: Bearer dev-cron-secret-change-me" \
  http://localhost:3000/api/cron/archive

# Retry Drive archiving for recurring charges that didn't upload
curl -H "Authorization: Bearer dev-cron-secret-change-me" \
  http://localhost:3000/api/cron/reconcile-receipts
```

To force a charge to be "due" for testing:

```sql
UPDATE subscriptions
SET next_charge_at = now() - interval '1 minute'
WHERE merchant_subscription_id = '<SUB>';
```

---

## 8. Test: automated end-to-end script

`scripts/e2e-autopay.mjs` drives the entire recurring pipeline (seed → charge →
webhook → receipt → Drive → retry → idempotency) and asserts each step. The dev
server must be running.

```bash
npm run test:e2e:autopay
```

Expected output ends with `✅ PASS`. It cleans up its own test rows.

- `--no-archive` skips the Drive assertions (if you don't have Drive creds set).
- `KEEP=1 npm run test:e2e:autopay` leaves the rows in place for inspection.

---

## 9. Test: the admin dashboard

1. http://localhost:3000/admin → sign in with `ADMIN_KEY`.
2. **Summary cards** show total raised, one-time this month, recurring/month
   (MRR), active recurring donors, and pending count.
3. **Needs-attention** panel appears only if there are failed charges,
   un-archived receipts, or stale pending payments.
4. **One-time** tab: filter/search, download receipts, open Drive links, Export
   CSV.
5. **Recurring** tab: per-donor amount, frequency, status, charges, total
   collected, next charge; **Export CSV**; **Cancel** an active mandate.

**Cancel test:** click **Cancel** on an ACTIVE mandate → confirm → its status
becomes `CANCELLED` and it won't be charged again.

---

## 10. Useful SQL for debugging

```sql
-- Recent one-time donations
SELECT txn_id, amount, status, donor_name, wants_receipt, drive_file_link
FROM donations ORDER BY created_at DESC LIMIT 10;

-- Recurring mandates with charge summary
SELECT s.donor_name, s.amount, s.status, s.next_charge_at,
       COUNT(r.id) FILTER (WHERE r.state='SUCCESS') AS charges,
       COUNT(r.id) FILTER (WHERE r.state='FAILED')  AS failed
FROM subscriptions s
LEFT JOIN redemptions r ON r.subscription_id = s.id
GROUP BY s.id ORDER BY s.created_at DESC;

-- Clean up test data
DELETE FROM subscriptions WHERE donor_name ILIKE 'test%';
DELETE FROM donations    WHERE donor_name ILIKE 'test%';
```

---

## 11. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Success page shows `selflesssewango.com` | `SITE_URL` not set to `http://localhost:3000`; restart after changing |
| `ENV Variable "X" is not defined` | Missing var in `.env.local`; restart the dev server after edits |
| 401 from a cron endpoint | `Authorization: Bearer <CRON_SECRET>` header missing/mismatched |
| Recurring stays `PENDING` after paying | Re-open `/payment-status?sub=...`; the status poll activates it |
| `drive_file_link` stays null | Google Apps Script vars missing, or run the relevant archive cron; check `archive_error` |
| Webhook returns "Redemption not found" | You used the subscription id, not the charge's `merchant_order_id` |
| PhonePe sandbox 500 on subscription status | Known sandbox limitation; the app falls back to order-completion to activate |

---

## 12. Going to production

- Set `PHONEPE_ENV=PRODUCTION` and use **production** OAuth credentials.
- Set `SITE_URL` to the live domain.
- Register the webhook URL (`/api/webhook/phonepe`) in the PhonePe dashboard and
  configure `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD`.
- Ensure all env vars are set in the hosting provider (e.g. Vercel project
  settings), not just `.env.local`.
- The crons in `vercel.json` run automatically on Vercel.
