import {
  activateSubscription,
  addFrequency,
  getSubscriptionByMerchantId,
  setSubscriptionStatus,
} from "@/db";
import { NextRequest } from "next/server";
import crypto from "crypto";

// PhonePe signs webhooks with SHA256(username:password) in the Authorization
// header. Configure the same username/password in the PhonePe dashboard and in
// env (PHONEPE_WEBHOOK_USERNAME / PHONEPE_WEBHOOK_PASSWORD).
function isAuthentic(authHeader: string | null): boolean {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!username || !password || !authHeader) return false;
  const expected = crypto
    .createHash("sha256")
    .update(`${username}:${password}`)
    .digest("hex");
  // constant-time compare
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!isAuthentic(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: any;
  try {
    event = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const payload = event?.payload ?? event;
    const merchantSubscriptionId =
      payload?.merchantSubscriptionId ??
      payload?.paymentFlow?.merchantSubscriptionId;
    const state: string | undefined = payload?.state;

    if (!merchantSubscriptionId) {
      // Not a subscription event we track; acknowledge so PhonePe stops retrying.
      return Response.json({ ok: true });
    }

    const sub = await getSubscriptionByMerchantId(merchantSubscriptionId);
    if (!sub) return Response.json({ ok: true });

    // Mandate setup completed -> activate and schedule first charge.
    if (state === "ACTIVE" || state === "COMPLETED") {
      const next = addFrequency(new Date(), sub.frequency);
      await activateSubscription(
        merchantSubscriptionId,
        payload?.subscriptionId ?? null,
        next,
      );
    } else if (state === "FAILED" || state === "REVOKED" || state === "CANCELLED") {
      await setSubscriptionStatus(
        merchantSubscriptionId,
        state === "CANCELLED" || state === "REVOKED" ? "CANCELLED" : "FAILED",
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("Webhook processing error", e);
    // Return 500 so PhonePe retries delivery.
    return Response.json({ error: "Processing error" }, { status: 500 });
  }
}
