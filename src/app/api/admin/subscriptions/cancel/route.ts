import { isAdmin } from "@/admin";
import { getSubscriptionByMerchantId, setSubscriptionCancelled } from "@/db";
import { cancelSubscription } from "@/phonepe";
import { NextRequest } from "next/server";

// Owner-only: cancel a recurring mandate. Cancels at PhonePe, then marks our
// ledger CANCELLED. Idempotent enough for an admin action.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { merchantSubscriptionId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const merchantSubscriptionId = body.merchantSubscriptionId;
  if (!merchantSubscriptionId) {
    return Response.json(
      { error: "Missing merchantSubscriptionId" },
      { status: 400 },
    );
  }

  const local = await getSubscriptionByMerchantId(merchantSubscriptionId);
  if (!local) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Best-effort cancel at PhonePe; if it's already cancelled/unavailable we
    // still reflect the owner's intent locally.
    try {
      await cancelSubscription(merchantSubscriptionId);
    } catch (e) {
      console.warn("PhonePe cancel failed; marking cancelled locally", e);
    }
    await setSubscriptionCancelled(merchantSubscriptionId);
    return Response.json({ status: "CANCELLED" });
  } catch (e) {
    console.error("Cancel subscription error", e);
    return Response.json({ error: "Cancel failed" }, { status: 500 });
  }
}
