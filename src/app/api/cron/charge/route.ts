import {
  addFrequency,
  bumpNextChargeAt,
  createRedemption,
  getDueSubscriptions,
  setRedemptionNotified,
  setRedemptionState,
} from "@/db";
import { notifyRedemption, redeem } from "@/phonepe";
import { NextRequest } from "next/server";
import crypto from "crypto";

// Triggered by Vercel Cron. Protected by CRON_SECRET so only Vercel (or an
// authorized caller) can run it.
//
// NOTE: A correct production flow notifies 24–48h BEFORE the debit, waits, then
// redeems. This simplified version notifies and redeems in one pass for due
// subscriptions — split into two scheduled passes once tested against sandbox.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await getDueSubscriptions();
  const results: Array<{ sub: string; ok: boolean; error?: string }> = [];

  for (const sub of due) {
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

      const { notificationId } = await notifyRedemption({
        merchantOrderId,
        merchantSubscriptionId: sub.merchant_subscription_id,
        amountPaise: sub.amount * 100,
      });
      await setRedemptionNotified(redemptionId, notificationId);

      await redeem({ merchantOrderId, notificationId });
      // Final SUCCESS/FAILED is confirmed via the webhook / order status;
      // mark NOTIFIED here and let the webhook finalize. For now, optimistic.
      await setRedemptionState(redemptionId, "SUCCESS");

      // Schedule the next cycle.
      const next = addFrequency(sub.next_charge_at ?? new Date(), sub.frequency);
      await bumpNextChargeAt(sub.id, next);

      results.push({ sub: sub.merchant_subscription_id, ok: true });
    } catch (e) {
      console.error("Charge error for", sub.merchant_subscription_id, e);
      results.push({
        sub: sub.merchant_subscription_id,
        ok: false,
        error: "charge_failed",
      });
    }
  }

  return Response.json({ processed: due.length, results });
}
