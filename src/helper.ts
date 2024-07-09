import axios from "axios";
import crypto from "crypto";

export function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (value == undefined) throw `ENV Variable "${name}" is not defined.`;
  return value;
}

export async function callStatusApi(merchantTransactionId: string) {
  const merchantId = "M22GE2J7US8VN";
  const saltKey = "fe68dfe6-a825-4479-8b54-9989aec729d6";
  const saltIndex = "1";
  const apiUrl = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const checksum =
    crypto
      .createHash("sha256")
      .update(`/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey)
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

  return axios.get(apiUrl, config);
}
