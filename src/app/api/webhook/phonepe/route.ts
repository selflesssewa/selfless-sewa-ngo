import {
  getRedemptionByMerchantOrderId,
  setRedemptionState,
} from "@/db";
import { archiveRedemption } from "@/archive";
import { NextRequest } from "next/server";

// PhonePe webhook callback for recurring charge confirmations.
// Receives notifications when a debit succeeds or fails.
export async function POST(request: NextRequest) {
  const body = await request.json();

  // PhonePe sends: { merchantOrderId, status, transactionId, ...other fields }
  const { merchantOrderId, status } = body;

  if (!merchantOrderId || !status) {
    return Response.json(
      { error: "Missing merchantOrderId or status" },
      { status: 400 }
    );
  }

  try {
    // Find the redemption by merchant order ID
    const redemption = await getRedemptionByMerchantOrderId(merchantOrderId);
    if (!redemption) {
      return Response.json({ error: "Redemption not found" }, { status: 404 });
    }

    // Map PhonePe status to our state (idempotent: only update if not already finalized)
    if (redemption.state === "NOTIFIED" || redemption.state === "CREATED") {
      const state = status === "SUCCESS" ? "SUCCESS" : "FAILED";
      await setRedemptionState(redemption.id, state);

      // If successful, queue receipt archiving (Phase 3b & 3c)
      if (state === "SUCCESS") {
        // Fire and forget: archive in background
        archiveRedemption(redemption.id, merchantOrderId).catch((e) =>
          console.error("Archive failed in webhook", e)
        );
      }

      return Response.json({
        success: true,
        redemptionId: redemption.id,
        state,
      });
    }

    // Already finalized; return success (idempotent)
    return Response.json({
      success: true,
      redemptionId: redemption.id,
      state: redemption.state,
      message: "Already finalized",
    });
  } catch (e) {
    console.error("Webhook error", e);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
