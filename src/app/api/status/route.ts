import axios from "axios";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantTxnId = searchParams.get("txnId");

  const merchantId = "M22GE2J7US8VN";
  const saltKey = "fe68dfe6-a825-4479-8b54-9989aec729d6";
  const saltIndex = "1";
  const apiUrl = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTxnId}`;

  const checksum =
    crypto
      .createHash("sha256")
      .update(`/pg/v1/status/${merchantId}/${merchantTxnId}` + saltKey)
      .digest("hex") +
    "###" +
    saltIndex;

  const config = {
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId,
    },
  };

  try {
    const response = await axios.get(apiUrl, config);
    const data = response.data;
    console.log(data);
    return Response.json(data);
  } catch (error) {
    console.error("Error:", error);
  }
  return Response.json(null);
}
