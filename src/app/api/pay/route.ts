import axios from "axios";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { getEnvVariable } from "@/helper";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(getEnvVariable("JWT_SECRET"));

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amountInRupees = searchParams.get("amount")!;

  const name = searchParams.get("name");
  const contact = searchParams.get("contact");
  const email = searchParams.get("email");
  // only present for the receipt flow
  const pan = searchParams.get("pan");
  const address = searchParams.get("address");

  const apiUrl = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
  const merchantId = getEnvVariable("PHONEPE_MERCHANT_ID");
  const saltKey = getEnvVariable("PHONEPE_SALT_KEY");
  const saltIndex = getEnvVariable("PHONEPE_SALT_INDEX");
  const merchantTransactionId = crypto
    .randomUUID()
    .replaceAll("-", "")
    .toUpperCase();
  const merchantUserId = "MUID123";

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

  const redirectUrl =
    "https://selflesssewango.com/payment-status" + `?t=${token}`;

  const payload = {
    merchantId: merchantId,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: merchantUserId,
    amount: parseInt(amountInRupees) * 100,
    redirectUrl: redirectUrl,
    redirectMode: "REDIRECT",
    ...(contact ? { mobileNumber: contact } : {}),
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const payloadJson = JSON.stringify(payload);
  const base64Payload = btoa(payloadJson);
  const checksum =
    crypto
      .createHash("sha256")
      .update(base64Payload + "/pg/v1/pay" + saltKey)
      .digest("hex") +
    "###" +
    saltIndex;

  const config = {
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
    },
  };
  const body = JSON.stringify({
    request: base64Payload,
  });

  try {
    const response = await axios.post(apiUrl, body, config);

    const responseData = response.data;
    if (
      responseData.success &&
      responseData.data.instrumentResponse.redirectInfo
    ) {
      const paymentUrl = responseData.data.instrumentResponse.redirectInfo.url;
      return Response.json({ paymentUrl, txnId: merchantTransactionId });
    } else {
      console.error("Payment initiation failed:", responseData.message);
      return Response.json(null);
    }
  } catch (error) {
    console.error("Error:", error);
  }
  return Response.json(null);
}
