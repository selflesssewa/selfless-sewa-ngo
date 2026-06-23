import {
  getRedemptionByMerchantOrderId,
  setRedemptionState,
} from "@/db";
import { archiveRedemption } from "@/archive";
import { NextRequest } from "next/server";
import { waitUntil } from "@vercel/functions";
import crypto from "crypto";

// Give the slow Apps Script Drive upload room to finish (Hobby allows up to 60s).
export const maxDuration = 60;

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

  const a = new Uint8Array(Buffer.from(received));
  const b = new Uint8Array(Buffer.from(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// PhonePe webhook callback for recurring charge confirmations.
// Receives notifications when a debit succeeds or fails.
export async function POST(request: NextRequest) {
  if (!isAuthentic(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // PhonePe v2 webhooks are nested: { event, payload: { merchantOrderId, state, ... } }.
  // Our tests / manual posts use a flat { merchantOrderId, status }. Accept both.
  const p = body?.payload ?? body;
  const merchantOrderId = p?.merchantOrderId ?? body?.merchantOrderId;
  const rawState: string | undefined = p?.state ?? p?.status ?? body?.status;

  if (!merchantOrderId || !rawState) {
    return Response.json(
      { error: "Missing merchantOrderId or state" },
      { status: 400 }
    );
  }

  // Map PhonePe's terminal states. Ignore non-terminal (e.g. PENDING) callbacks.
  const isSuccess = rawState === "COMPLETED" || rawState === "SUCCESS";
  const isFailed =
    rawState === "FAILED" || rawState === "FAILURE" || rawState === "DECLINED";
  if (!isSuccess && !isFailed) {
    return Response.json({ success: true, ignored: true, state: rawState });
  }

  try {
    // Find the redemption by merchant order ID
    const redemption = await getRedemptionByMerchantOrderId(merchantOrderId);
    if (!redemption) {
      return Response.json({ error: "Redemption not found" }, { status: 404 });
    }

    // Idempotent: only update if not already finalized.
    if (redemption.state === "NOTIFIED" || redemption.state === "CREATED") {
      const state = isSuccess ? "SUCCESS" : "FAILED";
      await setRedemptionState(redemption.id, state);

      // If successful, archive the receipt. waitUntil keeps the function alive
      // until the Drive upload completes so we capture the link.
      if (state === "SUCCESS") {
        waitUntil(
          archiveRedemption(redemption.id, merchantOrderId).catch((e) =>
            console.error("Archive failed in webhook", e)
          )
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
