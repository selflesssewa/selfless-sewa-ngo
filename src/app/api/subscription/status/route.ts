import { getSubscriptionByMerchantId } from "@/db";
import { getSubscriptionStatus } from "@/phonepe";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const merchantSubscriptionId = request.nextUrl.searchParams.get("sub");
  if (!merchantSubscriptionId) {
    return Response.json({ error: "Missing sub" }, { status: 400 });
  }

  const local = await getSubscriptionByMerchantId(merchantSubscriptionId);
  if (!local) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const phonepe = await getSubscriptionStatus(merchantSubscriptionId);
    return Response.json({
      status: local.status,
      amount: local.amount,
      frequency: local.frequency,
      nextChargeAt: local.next_charge_at,
      phonepe,
    });
  } catch (e) {
    console.error("Subscription status error", e);
    // Fall back to our own record if PhonePe is unreachable.
    return Response.json({
      status: local.status,
      amount: local.amount,
      frequency: local.frequency,
      nextChargeAt: local.next_charge_at,
    });
  }
}
