import { NextRequest } from "next/server";
import crypto from "crypto";
import { getEnvVariable } from "@/helper";
import { createPayment } from "@/phonepe";
import { insertPendingDonation } from "@/db";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(getEnvVariable("JWT_SECRET"));
const SITE_URL = process.env.SITE_URL ?? "https://selflesssewango.com";

// One-time donation via PhonePe Standard Checkout v2 (OAuth — same credentials
// as autopay). Creates a PG_CHECKOUT order and returns its hosted payment URL.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amountInRupees = searchParams.get("amount")!;

  const name = searchParams.get("name");
  const contact = searchParams.get("contact");
  const email = searchParams.get("email");
  // only present for the receipt flow
  const pan = searchParams.get("pan");
  const address = searchParams.get("address");

  const merchantTransactionId = crypto
    .randomUUID()
    .replaceAll("-", "")
    .toUpperCase();

  // The token carries donor details to the status/receipt pages (5-min expiry).
  const tokenPayload =
    pan && address && name && contact
      ? {
          id: merchantTransactionId,
          a: amountInRupees,
          p: pan,
          n: name,
          c: contact,
          ad: address,
        }
      : name && contact
        ? {
            id: merchantTransactionId,
            a: amountInRupees,
            n: name,
            c: contact,
            ...(email ? { e: email } : {}),
          }
        : { id: merchantTransactionId, a: amountInRupees };

  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("selflesssewa")
    .setIssuedAt()
    .setExpirationTime("5min")
    .sign(JWT_SECRET);

  const redirectUrl = `${SITE_URL}/payment-status?t=${token}`;

  try {
    const { redirectUrl: paymentUrl } = await createPayment({
      merchantOrderId: merchantTransactionId,
      amountPaise: parseInt(amountInRupees) * 100,
      redirectUrl,
    });

    if (!paymentUrl) {
      console.error("Payment initiation failed: no redirectUrl from PhonePe");
      return Response.json(null);
    }

    // Record a PENDING donation so the owner has a record of every attempt,
    // even if the donor closes the tab. Finalized on confirmation / reconcile.
    // Never let a ledger write break the payment redirect.
    try {
      await insertPendingDonation({
        txnId: merchantTransactionId,
        amount: parseInt(amountInRupees),
        wantsReceipt: Boolean(pan && address),
        donorName: name,
        donorContact: contact,
        donorEmail: email,
        donorPan: pan,
        donorAddress: address,
      });
    } catch (e) {
      console.error("Ledger insert failed (non-fatal):", e);
    }

    return Response.json({ paymentUrl, txnId: merchantTransactionId });
  } catch (error) {
    console.error("Error:", error);
  }
  return Response.json(null);
}
