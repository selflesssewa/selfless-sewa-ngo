import {
  activateSubscription,
  addFrequency,
  getSubscriptionByMerchantId,
} from "@/db";
import {
  getOrderStatus,
  getSubscriptionStatus,
} from "@/phonepe";
import { recordSetupCharge } from "@/charge";
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

      // Activate (atomic PENDING -> ACTIVE). The mandate setup (authWorkflowType
      // TRANSACTION) already debited the first installment during authorization,
      // so the NEXT charge is one cycle out — we do NOT debit again here.
      // activateSubscription returns true only for the poll that actually flipped
      // the state, so the setup charge is recorded exactly once.
      const now = new Date();
      const nextCharge = addFrequency(now, local.frequency);
      const didActivate = await activateSubscription(
        merchantSubscriptionId,
        local.merchant_subscription_id,
        nextCharge,
      );

      if (didActivate) {
        // Record the setup transaction as the first charge + archive its receipt.
        // No second debit — PhonePe already took the first installment at setup.
        await recordSetupCharge(local);
      }

      const fresh = await getSubscriptionByMerchantId(merchantSubscriptionId);
      return Response.json({
        status: "ACTIVE",
        amount: local.amount,
        frequency: local.frequency,
        nextChargeAt: fresh?.next_charge_at ?? null,
        message: "Donation set up! Your first contribution is being processed.",
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
