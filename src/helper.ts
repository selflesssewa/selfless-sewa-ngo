import axios from "axios";
import crypto from "crypto";

export function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (value == undefined) throw `ENV Variable "${name}" is not defined.`;
  return value;
}

export async function callStatusApi(merchantTransactionId: string) {
  const merchantId = getEnvVariable("PHONEPE_MERCHANT_ID");
  const saltKey = getEnvVariable("PHONEPE_SALT_KEY");
  const saltIndex = getEnvVariable("PHONEPE_SALT_INDEX");
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
