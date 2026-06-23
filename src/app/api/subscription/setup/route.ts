import { createSubscription } from "@/db";
import { setupSubscription, TPhonePeFrequency } from "@/phonepe";
import { NextRequest } from "next/server";
import crypto from "crypto";
import type { TFrequency } from "@/stores/donationStore";

const VALID_FREQUENCIES: TFrequency[] = [
  "MONTHLY",
  "QUARTERLY",
  "HALFYEARLY",
  "YEARLY",
];

const SITE_URL =
  process.env.SITE_URL ?? "https://selflesssewango.com";

// Mandate validity: 5 years from now (epoch ms).
const MANDATE_VALIDITY_MS = 5 * 365 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  const frequency = body.frequency as TFrequency;

  // --- server-side validation ---
  if (!Number.isInteger(amount) || amount < 1 || amount > 10_00_000) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!VALID_FREQUENCIES.includes(frequency)) {
    return Response.json({ error: "Invalid frequency" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : undefined;
  const contact = typeof body.contact === "string" ? body.contact : undefined;
  const email = typeof body.email === "string" ? body.email : undefined;
  const pan = typeof body.pan === "string" ? body.pan : undefined;
  const address = typeof body.address === "string" ? body.address : undefined;

  const merchantSubscriptionId = crypto
    .randomUUID()
    .replaceAll("-", "")
    .toUpperCase();
  const setupOrderId = crypto
    .randomUUID()
    .replaceAll("-", "")
    .toUpperCase();

  try {
    await createSubscription({
      merchantSubscriptionId,
      setupOrderId,
      amount,
      frequency,
      donorName: name,
      donorContact: contact,
      donorEmail: email,
      donorPan: pan,
      donorAddress: address,
    });

    const { redirectUrl } = await setupSubscription({
      merchantOrderId: setupOrderId,
      merchantSubscriptionId,
      amountPaise: amount * 100,
      maxAmountPaise: amount * 100, // FIXED: cap equals the per-cycle amount
      frequency: frequency as TPhonePeFrequency,
      redirectUrl: `${SITE_URL}/payment-status?sub=${merchantSubscriptionId}`,
      expireAtMs: Date.now() + MANDATE_VALIDITY_MS,
    });

    if (!redirectUrl) {
      return Response.json(
        { error: "Mandate setup failed" },
        { status: 502 },
      );
    }

    return Response.json({ redirectUrl, merchantSubscriptionId });
  } catch (e) {
    console.error("Subscription setup error", e);
    return Response.json({ error: "Mandate setup failed" }, { status: 500 });
  }
}
