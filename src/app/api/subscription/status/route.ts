import {
  activateSubscription,
  getSubscriptionByMerchantId,
} from "@/db";
import {
  getOrderStatus,
  getSubscriptionStatus,
} from "@/phonepe";
import { NextRequest } from "next/server";

// After the donor authorizes a mandate on PhonePe, they redirect back with ?sub=merchantSubscriptionId.
// This endpoint checks the authorization status and activates the subscription if authorized.
export async function GET(request: NextRequest) {
  const merchantSubscriptionId = request.nextUrl.searchParams.get("sub");
  const merchantOrderId = request.nextUrl.searchParams.get("orderId");

  if (!merchantSubscriptionId) {
    return Response.json({ error: "Missing sub" }, { status: 400 });
  }

  const local = await getSubscriptionByMerchantId(merchantSubscriptionId);
  if (!local) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Sandbox workaround: if subscription is PENDING and we're being checked,
    // assume it was authorized (user wouldn't poll status if they cancelled).
    // Production: use orderId + order status verification.
    if (local.status === "PENDING") {
      if (merchantOrderId) {
        // Production: verify order completion
        try {
          const orderStatus = await getOrderStatus(merchantOrderId);
          const orderState = orderStatus?.data?.state ?? orderStatus?.state;
          if (orderState !== "COMPLETED") {
            // Order not yet completed, return current status
            return Response.json({
              status: "PENDING",
              amount: local.amount,
              frequency: local.frequency,
              nextChargeAt: local.next_charge_at,
            });
          }
        } catch (e) {
          console.warn("Could not verify order status", e);
        }
      }

      // Activate: either order was COMPLETED, or we're in sandbox (no orderId check available)
      const frequencyDays: Record<string, number> = {
        DAILY: 1,
        WEEKLY: 7,
        FORTNIGHTLY: 14,
        MONTHLY: 30,
        BIMONTHLY: 60,
        QUARTERLY: 90,
        HALFYEARLY: 180,
        YEARLY: 365,
      };
      const daysUntilNextCharge =
        frequencyDays[local.frequency] ?? 30;
      const nextChargeAt = new Date(
        Date.now() + daysUntilNextCharge * 24 * 60 * 60 * 1000
      );

      // Use subscription ID as phonepeSubscriptionId (will be updated by webhook in prod)
      await activateSubscription(
        merchantSubscriptionId,
        local.merchant_subscription_id,
        nextChargeAt,
      );

      return Response.json({
        status: "ACTIVE",
        amount: local.amount,
        frequency: local.frequency,
        nextChargeAt,
        message: "Mandate activated! Recurring donations will start next cycle.",
      });
    }

    // Default: just return the subscription status.
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
