import {
  addFrequency,
  bumpNextChargeAt,
  createRedemption,
  getRedemptionByMerchantOrderId,
  setRedemptionNotified,
  setRedemptionState,
  type TSubscription,
} from "./db";
import { archiveRedemption } from "./archive";
import { notifyRedemption } from "./phonepe";
import { waitUntil } from "@vercel/functions";
import crypto from "crypto";

export type TChargeResult = {
  ok: boolean;
  redemptionId?: string;
  error?: string;
};

// Deterministic order id per (mandate, due-date). Because it's derived from the
// due date, a given cycle always maps to the SAME merchantOrderId — so a cron
// that runs twice, or a retry, can never double-charge (PhonePe dedups by id,
// and our own idempotency check below skips a cycle already in flight).
function redemptionOrderId(sub: TSubscription): string {
  const due = sub.next_charge_at ?? new Date();
  const period = due.toISOString().slice(0, 10).replaceAll("-", ""); // YYYYMMDD
  const h = crypto
    .createHash("sha256")
    .update(`${sub.merchant_subscription_id}:${period}`)
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `RDM${h}`;
}

// Kick off one recurring debit. We call notify with autoDebit:true, so PhonePe
// sends the NPCI pre-debit notification AND executes the debit itself — the
// final SUCCESS/FAILED lands via the webhook or the reconcile poll (which also
// generate + archive the receipt). Never throws.
//
// Scheduling is decoupled from the debit result: we advance next_charge_at only
// once PhonePe has *accepted* the notify. If notify fails, we DON'T advance, so
// the next cron run retries this same cycle instead of silently skipping it.
export async function chargeSubscription(
  sub: TSubscription,
): Promise<TChargeResult> {
  const merchantOrderId = redemptionOrderId(sub);

  try {
    // Idempotency: at most one debit per cycle. If this cycle was already kicked
    // off (NOTIFIED/SUCCESS/FAILED), don't notify again — just make sure the
    // schedule has moved on so the cron stops selecting this mandate.
    const existing = await getRedemptionByMerchantOrderId(merchantOrderId);
    if (existing && existing.state !== "CREATED") {
      await bumpNextChargeAt(
        sub.id,
        addFrequency(sub.next_charge_at ?? new Date(), sub.frequency),
      );
      return { ok: true, redemptionId: existing.id };
    }

    // Reuse a half-finished CREATED row (a prior run that died before notify
    // confirmed) or create a fresh one.
    const redemptionId =
      existing?.id ??
      (await createRedemption(sub.id, merchantOrderId, sub.amount));

    const expireAtMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
    const res = await notifyRedemption({
      merchantOrderId,
      merchantSubscriptionId: sub.merchant_subscription_id,
      amountPaise: sub.amount * 100,
      expireAtMs,
    });
    if (!res.orderId && !res.state) {
      throw new Error(
        `notify returned no orderId/state: ${JSON.stringify(res.raw)}`,
      );
    }

    // Notify accepted -> mark in-flight and advance the schedule one cycle.
    await setRedemptionNotified(redemptionId, res.orderId ?? merchantOrderId);
    await bumpNextChargeAt(
      sub.id,
      addFrequency(sub.next_charge_at ?? new Date(), sub.frequency),
    );

    return { ok: true, redemptionId };
  } catch (e) {
    // Notify failed: leave the redemption CREATED (retryable next run) and do
    // NOT advance the schedule, so the cycle is retried rather than skipped.
    console.error("Charge notify failed for", sub.merchant_subscription_id, e);
    return { ok: false, error: e instanceof Error ? e.message : "charge_failed" };
  }
}

// The mandate setup uses authWorkflowType TRANSACTION, so PhonePe debits the
// first installment during authorization — the setup order IS the first charge.
// Record it as a SUCCESS redemption (keyed by the unique setup_order_id, which
// makes this idempotent) and generate + archive its receipt. Does NOT perform a
// second debit. The caller sets next_charge_at one cycle out at activation.
export async function recordSetupCharge(sub: TSubscription): Promise<void> {
  const redemptionId = await createRedemption(
    sub.id,
    sub.setup_order_id,
    sub.amount,
  );
  await setRedemptionState(redemptionId, "SUCCESS");
  // Owner's receipt copy; waitUntil keeps the function alive until the Drive
  // upload completes. The receipt retry cron backstops any Drive hiccup.
  waitUntil(
    archiveRedemption(redemptionId, sub.setup_order_id).catch((e) =>
      console.error("Setup-charge archive failed (non-fatal):", e),
    ),
  );
}
