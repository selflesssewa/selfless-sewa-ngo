import { getSubscriptionByMerchantId, setSubscriptionStatus } from "@/db";
import { cancelSubscription } from "@/phonepe";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const merchantSubscriptionId =
    typeof body.sub === "string" ? body.sub : null;
  if (!merchantSubscriptionId) {
    return Response.json({ error: "Missing sub" }, { status: 400 });
  }

  const local = await getSubscriptionByMerchantId(merchantSubscriptionId);
  if (!local) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await cancelSubscription(merchantSubscriptionId);
    await setSubscriptionStatus(merchantSubscriptionId, "CANCELLED");
    return Response.json({ status: "CANCELLED" });
  } catch (e) {
    console.error("Subscription cancel error", e);
    return Response.json({ error: "Cancel failed" }, { status: 502 });
  }
}
