import axios from "axios";
import SHA256 from "crypto-js/sha256";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantTxnId = searchParams.get("txnId");

  const merchantId = "M22GE2J7US8VN";
  const saltKey = "fe68dfe6-a825-4479-8b54-9989aec729d6";
  const saltIndex = "1";
  const apiUrl = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTxnId}`;
  // const apiUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTxnId}`;

  const checksum =
    SHA256(`pg/v1/status/${merchantId}/${merchantTxnId}` + saltKey).toString() +
    "###" +
    saltIndex;

  const config = {
    headers: {
      accept: "text/plain",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId,
    },
  };

  try {
    const response = await axios.get(apiUrl, config);
    console.log(response);
    return Response.json(response);
  } catch (error) {
    console.error("Error:", error);
  }
  return Response.json(null);
}
