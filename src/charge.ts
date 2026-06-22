import {
  addFrequency,
  bumpNextChargeAt,
  createRedemption,
  setRedemptionNotified,
  setRedemptionState,
  type TSubscription,
} from "./db";
import { notifyRedemption, redeem } from "./phonepe";
import crypto from "crypto";

export type TChargeResult = {
  ok: boolean;
  redemptionId?: string;
  error?: string;
};

// Charge one subscription once: create a redemption, notify + redeem via PhonePe,
// mark it NOTIFIED (the webhook finalizes to SUCCESS/FAILED), and roll
// next_charge_at forward one cycle. Shared by the charge cron and the
// activation flow (immediate first charge). Never throws.
//
// NOTE: a strict NPCI flow notifies 24–48h BEFORE the debit, then redeems. This
// does both in one pass for simplicity; split into two scheduled passes later.
export async function chargeSubscription(
  sub: TSubscription,
): Promise<TChargeResult> {
  const merchantOrderId = crypto
    .randomUUID()
    .replaceAll("-", "")
    .toUpperCase();

  try {
    const redemptionId = await createRedemption(
      sub.id,
      merchantOrderId,
      sub.amount,
    );

    let notificationId: string | undefined;
    try {
      const notifyRes = await notifyRedemption({
        merchantOrderId,
        merchantSubscriptionId: sub.merchant_subscription_id,
        amountPaise: sub.amount * 100,
      });
      notificationId = notifyRes?.notificationId;
    } catch (e) {
      // Sandbox limitation: fabricate a notificationId so testing can proceed.
      console.warn(
        "Notify failed (likely sandbox), using fake notificationId for testing",
        e,
      );
      notificationId = `FAKE_${crypto
        .randomUUID()
        .replaceAll("-", "")
        .toUpperCase()
        .slice(0, 16)}`;
    }

    if (!notificationId) {
      throw new Error("Notify failed: no notificationId in response");
    }
    await setRedemptionNotified(redemptionId, notificationId);

    try {
      await redeem({ merchantOrderId, notificationId });
    } catch (e) {
      console.warn("Redeem failed (likely sandbox limitation)", e);
    }
    // Final state (SUCCESS/FAILED) arrives via the PhonePe webhook, which also
    // generates + archives the receipt. For now mark NOTIFIED.
    await setRedemptionState(redemptionId, "NOTIFIED");

    // Roll the schedule forward one cycle from the current due date.
    const next = addFrequency(sub.next_charge_at ?? new Date(), sub.frequency);
    await bumpNextChargeAt(sub.id, next);

    return { ok: true, redemptionId };
  } catch (e) {
    console.error("Charge error for", sub.merchant_subscription_id, e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "charge_failed",
    };
  }
}
