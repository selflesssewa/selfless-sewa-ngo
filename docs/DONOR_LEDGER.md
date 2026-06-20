# Donor Ledger + On-Demand Receipts (#9A)

**What this adds:** every one-time donation is now recorded in the Neon Postgres
database, and the NGO owner can view the full list and re-download any receipt
at any time from a protected `/admin` page. Previously there was **no record** of
who donated (especially when a receipt wasn't requested) and receipts could only
be downloaded once.

This is independent of the recurring/autopay feature (#9B) — it uses the
existing one-time payment flow and needs no PhonePe subscription credentials.

---

## How it works

```
Donor submits the form
   │
   ▼
GET /api/pay
   • initiates the PhonePe payment
   • INSERTs a PENDING row in `donations` (with name/phone/email, and
     PAN/address if a receipt was requested)   ← record exists from the start
   ▼
Donor pays on PhonePe → returns to /payment-status
   • the page polls GET /api/status
   • when PhonePe reports COMPLETED/FAILED, the row is finalized
     (status + payment mode)
   │
   └─ if the donor closes the tab early:
      /api/cron/reconcile (Vercel Cron, every 6h) re-checks any PENDING
      rows older than 15 min and finalizes them.
```

Receipts are **regenerated on demand** from the stored row (no PDF files are
saved anywhere), so the owner — and the donor — can download a receipt anytime.

---

## Files

**New**
- `db/` → `donations` table added to `db/schema.sql`
- `src/receipt.ts` — the receipt PDF generator (extracted so it's reusable)
- `src/admin.ts` — admin key check
- `src/app/admin/page.tsx` — the owner's donations page
- `src/app/api/admin/donations/route.ts` — ledger JSON (protected)
- `src/app/api/admin/receipt/route.ts` — re-download a receipt (protected)
- `src/app/api/cron/reconcile/route.ts` — closed-tab finalizer (Vercel Cron)

**Changed**
- `src/db.ts` — donation helpers (insert/finalize/get/list/stale)
- `src/app/api/pay/route.ts` — writes the PENDING row
- `src/app/api/status/route.ts` — finalizes on COMPLETED/FAILED
- `src/app/api/receipt/route.ts` — now uses `src/receipt.ts`
- `db/migrate.mjs`, `package.json` — `npm run db:migrate` loads `.env.local`
- `vercel.json` — added the reconcile cron

---

## Environment variables

Add to `.env.local` (local) and to Vercel (Production + Preview):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection (app + cron) |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (migrations) |
| `ADMIN_KEY` | Password for the `/admin` page |
| `CRON_SECRET` | Protects the cron routes |

> `.env.local` is gitignored — never put real secrets in `.env.example`.

---

## How to test

### 1. One-time setup
```bash
# create the tables (run once per database)
npm run db:migrate
```

### 2. Run the app
```bash
npm run dev
```

### 3. The admin page
- Open <http://localhost:3000/admin>
- Enter the `ADMIN_KEY` from `.env.local` and click **Load**.
- You'll see the donations list (empty until there are donations). Completed
  donations that requested a receipt show a **Download** link.

### 4. A donation end-to-end
- Open <http://localhost:3000/donate>, fill the form, and submit.
- A **PENDING** row is written immediately — visible on `/admin`.
- After paying, the row flips to **COMPLETED** with the payment mode.
- Note: the post-payment redirect points at the production domain, so a full
  real-payment confirmation is best tested on a deployed Preview. The database
  write/read path itself is verified.

### 5. Verify the database directly (optional)
```bash
node --env-file=.env.local -e "const{Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});c.connect().then(()=>c.query('select txn_id,amount,status,donor_name,created_at from donations order by created_at desc limit 10')).then(r=>{console.table(r.rows);return c.end();})"
```

---

## Notes / known issues

- **Production build is currently blocked by the v2 autopay code** (not this
  feature): `src/app/api/subscription/setup/route.ts` and the `src/__tests__`
  have type errors (`expireAtMs` / `TSetupParams`). `npm run dev` is fine, but
  `npm run build` will fail until the autopay code is fixed — that's part of the
  separate #9B work waiting on PhonePe OAuth credentials.
- Receipts only regenerate for **completed** donations that captured the receipt
  fields (name + PAN + contact + address). Anonymous/non-receipt donations still
  appear in the ledger, just without a receipt to download.
- Neon free-tier compute auto-suspends when idle; the first request after a pause
  may be a little slow while it wakes up.
