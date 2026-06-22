# PhonePe Autopay (#9B) — Design & Implementation Plan

**Status:** Credentials acquired ✅. Design phase. v2 OAuth working with test credentials.

---

## What's Already Built (Ashutosh's v2 work)

### Schema (✅ exists, works)
- `subscriptions` table: mandate records (status = PENDING|ACTIVE|PAUSED|CANCELLED|FAILED)
- `redemptions` table: charge attempts per subscription (state = CREATED|NOTIFIED|SUCCESS|FAILED)
- Indices on `subscriptions.next_charge_at` (for the cron) and `redemptions.subscription_id`

### DB helpers (✅ exist, not tested)
- `createSubscription()` — insert a PENDING mandate
- `getSubscriptionByMerchantId()` — fetch by our ID
- `activateSubscription()` — move PENDING → ACTIVE after mandate authorization
- `getDueSubscriptions()` — find subscriptions where `next_charge_at <= now()` (for the cron)
- `createRedemption()` — insert a charge attempt (CREATED state)
- `setRedemptionNotified()`, `setRedemptionState()` — update charge state
- `bumpNextChargeAt()` — move the next charge date after frequency

### PhonePe integration (`src/phonepe.ts`, ⚠️ has issues)
- `getAccessToken()` — OAuth token cache + refresh (60s before expiry)
- `authHeaders()` — return `{ Authorization: O-Bearer <token>, Content-Type: application/json }`
- `setupSubscription(p)` — POST `/checkout/v2/pay` to initiate mandate (returns redirect URL)
- `getOrderStatus(merchantOrderId)` — GET after redirect to check if mandate was authorized
- `getSubscriptionStatus(merchantSubscriptionId)` — GET to check mandate state (ACTIVE|CANCELLED|REVOKED)
- `notifyRedemption(params)` — POST `/checkout/v2/subscriptions/notify` (pre-debit alert to donor)
- `redeem(params)` — POST `/checkout/v2/subscriptions/redeem` (actual debit)
- `cancelSubscription(merchantSubscriptionId)` — POST to cancel mandate

### Donation form UI (✅ exists, partially done)
- Toggle for "Set up recurring donation" (currently in `src/stores/donationStore.ts`)
- Frequency selector (MONTHLY, QUARTERLY, HALFYEARLY, YEARLY)
- UI in [src/app/donate/page.tsx](src/app/donate/page.tsx)

### API routes (⚠️ partially broken)
- **[/api/subscription/setup](src/app/api/subscription/setup/route.ts)** — accepts `{amount, frequency, name, contact, email, pan, address}` and calls `setupSubscription()`. Creates a PENDING subscription record.
  - ❌ **BUG:** calls `setupSubscription()` with `expireAtMs` (type error: field doesn't exist in `TSetupParams`).
  - ❌ **Flow error:** after setup succeeds, it should return a redirect URL to the donor, NOT just JSON. The donor must go through PhonePe's mandate authorization.
- **[/api/cron/charge](src/app/api/cron/charge/route.ts)** — finds due subscriptions, calls `notifyRedemption()` then `redeem()` in one pass.
  - ❌ **BUG:** calls `notifyRedemption()` and `redeem()`, but current code doesn't handle the response properly or transition states correctly.
  - ⚠️ **Architecture issue:** NPCI rules require notify 24–48h BEFORE debit, then a separate debit pass. This code does both in one shot.

### Webhook (incomplete)
- [/api/phonepe/webhook/route.ts](src/app/api/phonepe/webhook/route.ts) — stub for mandate/redemption status updates.

### Tests (❌ broken)
- [src/__tests__/phonepe-token.test.ts](src/__tests__/phonepe-token.test.ts) — type error: `expireAtMs` doesn't exist on `TSetupParams`.
- [src/__tests__/subscription-setup.test.ts](src/__tests__/subscription-setup.test.ts) — top-level await + type issues.

---

## What Needs to Be Built / Fixed

### Phase 1: Unblock & Fix Type Errors (Quick, high-impact)

1. **Fix `TSetupParams`** — remove `expireAtEpochMs` field or rename to `expireAtMs` everywhere (Ashutosh's naming mismatch).
2. **Fix the test files** — correct the type errors so `npm run build` doesn't fail.
3. **Fix `/api/subscription/setup`** — return a redirect URL (redirect the donor to PhonePe), not JSON. The donor must authorize the mandate.
   - Flow: `setupSubscription()` → get redirectUrl → respond with `{ redirectUrl }` → frontend redirects donor.

### Phase 2: Mandate Authorization (the OAuth flow)

After the donor authorizes on PhonePe and returns:

4. **Create `/api/subscription/status` endpoint** — poll this after redirect (donor or frontend polls).
   - Call `getOrderStatus(merchantOrderId)`.
   - If state = COMPLETED, call `getSubscriptionStatus(merchantSubscriptionId)` to get the PhonePe subscription ID.
   - Call `activateSubscription(merchantSubscriptionId, phonepeSubscriptionId, nextChargeAt)` to move subscription to ACTIVE.
   - Calculate `nextChargeAt` based on frequency (e.g., MONTHLY → now + 30 days).

5. **Update the donation form flow** — after mandate setup redirect returns, poll `/api/subscription/status`.

### Phase 3: Recurring Charges (the charge cron)

6. **Fix `/api/cron/charge`** — separate into two scheduled passes (or document why we're doing both in one).
   - Current logic: get due subscriptions → call `notifyRedemption()` → call `redeem()`.
   - **Better logic:**
     - **Pass 1 (notify):** call `notifyRedemption()` on subscriptions due for charging. Update redemption state to NOTIFIED. Set the next charge date 24–48h from now.
     - **Pass 2 (debit, separate cron run):** call `redeem()` on NOTIFIED redemptions. Update state to SUCCESS/FAILED. Add ledger record.
   - For now: document that we're doing both in one pass (simplified, acceptable for MVP).

7. **Add receipt generation** — after redemption SUCCESS, generate a per-cycle receipt (reuse `generateAcknowledgmentPdf` from #9A, include subscription details).

8. **Add Drive archiving** — archive the per-cycle receipt to Drive (reuse `archiveDonation` logic from #9A).

### Phase 4: Webhook & Notifications (optional, for live robustness)

9. **Implement the webhook** — PhonePe sends mandate/redemption status updates. Validate & update the DB.

### Phase 5: Admin & Donor Ledger (can be deferred)

10. **Admin: Subscription management** — list subscriptions, show status, allow cancel.
11. **Donor: Manage subscriptions** — view active mandates, cancel, update frequency.

---

## Architecture / Data Flow

### 1. Setup (Mandate Authorization)

```
Donor fills form → amount, frequency, name, contact, email, pan, address
          ▼
POST /api/subscription/setup
          ▼
Create PENDING subscription record (in DB)
          ▼
Call setupSubscription(merchantOrderId, merchantSubscriptionId, ...)
          ▼
Get OAuth token (cached) ✅
          ▼
POST /checkout/v2/pay with subscription details
          ▼
PhonePe returns { redirectUrl, orderId, ... }
          ▼
Respond: { redirectUrl }
          ▼
Frontend redirects donor to PhonePe (donor authorizes mandate on UPI app)
          ▼
PhonePe redirects donor back to our callback (e.g., /payment-status?t=xxx&orderId=xxx)
          ▼
Frontend polls GET /api/subscription/status?merchantOrderId=xxx&merchantSubscriptionId=xxx
          ▼
If state = COMPLETED:
  • Get the PhonePe subscription ID from status
  • Activate subscription (PENDING → ACTIVE)
  • Set next_charge_at based on frequency
          ▼
Donor sees "Mandate active!" message
```

### 2. Recurring Charge (every cycle)

```
Cron (e.g., daily) runs GET /api/cron/charge
          ▼
Find subscriptions where next_charge_at <= now() AND status = ACTIVE
          ▼
For each subscription:
  • Create a redemption record (CREATED state)
  • Call notifyRedemption(merchantOrderId, merchantSubscriptionId, amount)
  • Update redemption state to NOTIFIED
  • Optionally: skip redeem() for now (or call it in a separate cron 24h later for NPCI compliance)
          ▼
For each NOTIFIED redemption (or immediately):
  • Call redeem(merchantOrderId, notificationId)
  • Update redemption state to SUCCESS/FAILED
  • If SUCCESS:
    - Generate receipt PDF (per-cycle acknowledgment)
    - Archive to Drive
    - Append to donations ledger (for the owner's records)
  • Update next_charge_at: add one frequency period
```

### 3. Cancellation

```
Donor requests cancel or admin cancels
          ▼
POST /api/subscription/cancel?merchantSubscriptionId=xxx
          ▼
Call cancelSubscription()
          ▼
Update DB: status = CANCELLED
```

---

## Implementation Roadmap

| Phase | Task | Type | Effort | Blocker |
|-------|------|------|--------|---------|
| 1a | Fix `TSetupParams` type error | Bug | 5 min | None |
| 1b | Fix test files (type errors) | Bug | 15 min | None |
| 1c | Fix `/api/subscription/setup` to return redirect URL | Fix | 20 min | None |
| 2a | Create `/api/subscription/status` endpoint | New | 30 min | None |
| 2b | Wire frontend redirect → status poll | UI | 30 min | None |
| 3a | Fix `/api/cron/charge` (implement notify + redeem) | Fix | 45 min | None |
| 3b | Add receipt generation (per-cycle) | New | 30 min | #9A (done) |
| 3c | Add Drive archiving for per-cycle receipts | New | 20 min | #9A (done) |
| 4 | Webhook implementation | New | 60 min | Optional |
| 5 | Admin subscription mgmt + donor ledger | New | 90 min | Nice-to-have |

**Total: ~4–5 hours** (v1 without webhook/admin).

---

## Known Bugs (from Ashutosh's code)

| Bug | File | Line | Fix |
|-----|------|------|-----|
| `expireAtMs` doesn't exist in `TSetupParams` | `src/phonepe.ts` | 78 | Rename or remove field (check usage) |
| Endpoint path not verified | `src/phonepe.ts` | 149–150, 173–174 | Confirm with PhonePe docs / test against sandbox |
| Setup route returns JSON instead of redirect | `src/app/api/subscription/setup/route.ts` | ~70 | Respond with `{ redirectUrl }` for frontend to redirect |
| Notify + redeem called in one pass | `src/app/api/cron/charge/route.ts` | ~40 | Document as MVP, plan split for production |
| Test type errors | `src/__tests__/*` | various | Fix types to match actual function signatures |

---

## Ready to Start?

**Next step:** Do you want me to:
1. **Fix Phase 1 first** (unblock the build, fix type errors)?
2. **Jump straight to Phase 2** (implement the mandate authorization flow)?
3. **Start with a full implementation** (phases 1–3 in one go)?

Which approach?
