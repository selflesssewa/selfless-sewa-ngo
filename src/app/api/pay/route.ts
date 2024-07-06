import axios from "axios";
import SHA256 from "crypto-js/sha256";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amount = searchParams.get("amount")!;

  const apiUrl = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
  //const apiUrl = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
  const merchantId = "M22GE2J7US8VN";
  const saltKey = "fe68dfe6-a825-4479-8b54-9989aec729d6";
  const saltIndex = "1";
  const merchantTransactionId = crypto.randomUUID();
  const merchantUserId = "MUID123";
  // const redirectUrl = `https://selflesssewango.com/payment-status?t=${merchantTransactionId}&a=${amount}`;
  const redirectUrl = `http://localhost:3000/payment-status`;

  const payload = {
    merchantId: merchantId,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: merchantUserId,
    amount: parseInt(amount) * 100,
    redirectUrl: redirectUrl,
    redirectMode: "REDIRECT",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const payloadJson = JSON.stringify(payload);
  const base64Payload = btoa(payloadJson);
  const checksum =
    SHA256(base64Payload + "/pg/v1/pay" + saltKey).toString() +
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
