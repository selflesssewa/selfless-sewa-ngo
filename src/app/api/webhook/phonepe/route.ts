import {
  getRedemptionByMerchantOrderId,
  setRedemptionState,
} from "@/db";
import { archiveRedemption } from "@/archive";
import { NextRequest } from "next/server";
import crypto from "crypto";

// Verify the webhook really came from PhonePe. PhonePe sends
// `Authorization: SHA256(username:password)` (hex), using the credentials you
// configure in the PhonePe dashboard (mirrored in PHONEPE_WEBHOOK_USERNAME /
// PHONEPE_WEBHOOK_PASSWORD).
//
// - If the secret is configured: enforce it (reject mismatches).
// - PRODUCTION without the secret configured: fail closed (misconfiguration).
// - SANDBOX without the secret: allow (so local/sandbox testing can POST freely).
function isAuthentic(request: NextRequest): boolean {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;

  if (!username || !password) {
    if (process.env.PHONEPE_ENV === "PRODUCTION") {
      console.error(
        "Webhook secret not configured (PHONEPE_WEBHOOK_USERNAME/PASSWORD) — rejecting in PRODUCTION",
      );
      return false;
    }
    return true; // sandbox/dev convenience
  }

  const expected = crypto
    .createHash("sha256")
    .update(`${username}:${password}`)
    .digest("hex");
  const received = request.headers.get("authorization") ?? "";

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// PhonePe webhook callback for recurring charge confirmations.
// Receives notifications when a debit succeeds or fails.
export async function POST(request: NextRequest) {
  if (!isAuthentic(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
