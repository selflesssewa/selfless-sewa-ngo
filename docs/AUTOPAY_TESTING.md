# PhonePe Autopay (#9B) — Testing Guide (Phases 1-3a)

**Goal:** Verify mandate setup, activation, and charging flow against PhonePe sandbox.

---

## Prerequisites

1. **App running locally:**
   ```bash
   npm run dev:turbo
   ```

2. **Database connection:** Confirm `DATABASE_URL` in `.env.local` points to your Neon DB.

3. **PhonePe credentials:** Test-mode credentials in `.env.local`:
   ```
   PHONEPE_CLIENT_ID=M22GE2J7US8VN_2606221620
   PHONEPE_CLIENT_SECRET=NjdjM2I1YWUtZGVkOC00NzdmLWFjYzYtNzMwYTI2OGJhYjgw
   PHONEPE_ENV=SANDBOX
   ```

4. **Cron secret:** Set for testing:
   ```
   CRON_SECRET=dev-cron-secret-change-me
   ```

---

## Test Cases

### ✅ Test 1: Mandate Setup (Phase 2)

**Flow:**
1. Open http://localhost:3000/donate
2. Select "Give recurring"
3. Choose frequency (MONTHLY, QUARTERLY, etc.)
4. Fill amount (₹100+), name, phone, email
5. Click submit

**Expected:**
- Form posts to `/api/subscription/setup`
- Response: `{ redirectUrl, merchantSubscriptionId }`
- Browser redirects to PhonePe sandbox mandate page
- Subscription record created in DB: `subscriptions` table with status = PENDING

**Check database:**
```sql
SELECT * FROM subscriptions WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 1;
```

Should show:
- `merchant_subscription_id` (UUID, no dashes, uppercase)
- `amount` in rupees
- `frequency` (MONTHLY, etc.)
- `status` = PENDING
- `next_charge_at` = null (not set until activated)

---

### ✅ Test 2: Mandate Authorization (Phase 2)

**On PhonePe sandbox:**
1. You're redirected to PhonePe's mandate authorization page
2. Authorize the mandate (use sandbox test UPI/card)
3. PhonePe redirects back to http://localhost:3000/payment-status?sub=<merchantSubscriptionId>&orderId=<orderId>

**Expected:**
- Frontend polls `/api/subscription/status?sub=<merchantSubscriptionId>&orderId=<orderId>`
- Endpoint checks `getOrderStatus()` → state = COMPLETED
- Endpoint checks `getSubscriptionStatus()` → state = ACTIVE
- Endpoint calls `activateSubscription()` with `phonepeSubscriptionId` and `next_charge_at`
- Frontend shows "Mandate activated! Recurring donations will start next cycle."

**Check database:**
```sql
SELECT * FROM subscriptions WHERE merchant_subscription_id = '<your-id>';
```

Should now show:
- `status` = ACTIVE (changed from PENDING)
- `phonepe_subscription_id` = <set by PhonePe>
- `next_charge_at` = ~30 days from now (for MONTHLY)

---

### ✅ Test 3: Manual Charge Cron Trigger (Phase 3a)

**Set the next charge date to now (to trigger the cron):**
```sql
UPDATE subscriptions 
SET next_charge_at = now() - interval '1 minute'
WHERE merchant_subscription_id = '<your-id>';
```

**Call the cron manually:**
```bash
curl -H "Authorization: Bearer dev-cron-secret-change-me" \
  http://localhost:3000/api/cron/charge
```

**Expected response:**
```json
{
  "processed": 1,
  "results": [
    {
      "sub": "<merchant_subscription_id>",
      "ok": true,
      "redemptionId": "<uuid>"
    }
  ]
}
```

**Check database:**
```sql
SELECT * FROM redemptions WHERE merchant_order_id LIKE '%' ORDER BY attempted_at DESC LIMIT 1;
```

Should show:
- `subscription_id` = (FK to your subscription)
- `state` = NOTIFIED (awaiting webhook)
- `amount` = subscription amount * 100 (in paise)

**Check subscriptions.next_charge_at:**
```sql
SELECT next_charge_at FROM subscriptions WHERE merchant_subscription_id = '<your-id>';
```

Should be ~30 days from now (bumped by cron).

---

## Test Results (Verified 2026-06-22)

✅ **All Tests Passed**

| Test | Result | Details |
|------|--------|---------|
| Test 1: Mandate Setup | ✅ PASS | Subscription created in DB with status=PENDING |
| Test 2: Mandate Authorization | ✅ PASS | Subscription activated (status=ACTIVE, next_charge_at set to ~30 days) |
| Test 3: Charge Cron | ✅ PASS | Redemption created with state=NOTIFIED, cron processes due subscriptions |

---

## Known Limitations (Phase 1-3a)

- ⚠️ **No webhook yet:** Redemptions stay in NOTIFIED state. No SUCCESS/FAILED confirmation yet.
- ⚠️ **No per-cycle receipts:** Receipts not generated or archived yet.
- ⚠️ **Sandbox workarounds:** PhonePe sandbox doesn't fully simulate subscription status/notify/redeem, so code generates fake notification IDs for testing (marked with `FAKE_` prefix).

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| "Missing sub" error on status endpoint | Ensure PhonePe redirects back with `?sub=` param |
| "Not found" error | Confirm subscription was created in DB (check phone number is unique key?) |
| Cron returns 401 | Verify `CRON_SECRET` matches in `.env.local` |
| `notifyRedemption` fails | Check PhonePe sandbox credentials are active |
| `next_charge_at` stays in past | Check the subscription's `frequency` is valid |

---

## Next Steps (After Testing)

Once you verify Tests 1-3 work:
- Phase 4: Implement the webhook to confirm charges (SUCCESS/FAILED)
- Phase 3b: Generate per-cycle receipts on SUCCESS
- Phase 3c: Archive per-cycle receipts to Drive

---

## Database Queries (for debugging)

```sql
-- List all subscriptions
SELECT merchant_subscription_id, amount, frequency, status, next_charge_at 
FROM subscriptions ORDER BY created_at DESC;

-- List all redemptions for a subscription
SELECT r.* FROM redemptions r
JOIN subscriptions s ON r.subscription_id = s.id
WHERE s.merchant_subscription_id = '<your-id>'
ORDER BY r.attempted_at DESC;

-- Check if a subscription is due for charging
SELECT * FROM subscriptions 
WHERE status = 'ACTIVE' AND next_charge_at <= now()
ORDER BY next_charge_at ASC;
```
