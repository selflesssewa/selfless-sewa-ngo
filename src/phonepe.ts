import axios from "axios";
import { getEnvVariable } from "./helper";

// PhonePe Standard Checkout v2 (Autopay / Subscriptions) client.
//
// NOTE: This is wired to PhonePe's documented v2 spec but is UNTESTED until
// real credentials with Autopay enabled exist. Verify exact endpoint paths and
// payload field names against your PhonePe dashboard before going live.

const IS_PROD = process.env.PHONEPE_ENV === "PRODUCTION";

const OAUTH_URL = IS_PROD
  ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

const API_BASE = IS_PROD
  ? "https://api.phonepe.com/apis/pg"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox";

// ---- OAuth token (cached until shortly before expiry) ----

let cachedToken: { token: string; expiresAtMs: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAtMs - 60_000) {
    return cachedToken.token;
  }

  const body = new URLSearchParams({
    client_id: getEnvVariable("PHONEPE_CLIENT_ID"),
    client_secret: getEnvVariable("PHONEPE_CLIENT_SECRET"),
    client_version: process.env.PHONEPE_CLIENT_VERSION ?? "1",
    grant_type: "client_credentials",
  });

  const { data } = await axios.post(OAUTH_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // PhonePe returns access_token + expires_at (epoch seconds).
  cachedToken = {
    token: data.access_token,
    expiresAtMs: (data.expires_at ?? Math.floor(Date.now() / 1000) + 3000) * 1000,
  };
  return cachedToken.token;
}

async function authHeaders() {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json",
    Authorization: `O-Bearer ${token}`,
  };
}

export type TPhonePeFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "HALFYEARLY"
  | "YEARLY";

export type TSetupParams = {
  merchantOrderId: string;
  merchantSubscriptionId: string;
  amountPaise: number; // per-cycle amount, in paise
  maxAmountPaise: number; // mandate ceiling, in paise
  frequency: TPhonePeFrequency;
  redirectUrl: string;
  expireAtMs: number; // mandate validity (epoch ms)
};

// Phase 1 — create the mandate. Returns the PhonePe checkout redirect URL.
export async function setupSubscription(p: TSetupParams): Promise<{
  redirectUrl: string;
  orderId?: string;
  raw: unknown;
}> {
  const payload = {
    merchantOrderId: p.merchantOrderId,
    amount: p.amountPaise,
    expireAt: p.expireAtMs,
    paymentFlow: {
      type: "SUBSCRIPTION_SETUP",
      merchantSubscriptionId: p.merchantSubscriptionId,
      authWorkflowType: "TRANSACTION",
      amountType: "FIXED",
      maxAmount: p.maxAmountPaise,
      frequency: p.frequency,
      expireAt: p.expireAtMs,
    },
    // For Standard Checkout (hosted redirect):
    redirectUrl: p.redirectUrl,
  };

  const { data } = await axios.post(
    `${API_BASE}/subscriptions/v2/setup`,
    payload,
    { headers: await authHeaders() },
  );

  const redirectUrl =
    data?.redirectUrl ?? data?.data?.redirectUrl ?? data?.data?.instrumentResponse?.redirectInfo?.url;

  return { redirectUrl, orderId: data?.orderId ?? data?.data?.orderId, raw: data };
}

// Check the setup transaction's status.
export async function getOrderStatus(merchantOrderId: string) {
  const { data } = await axios.get(
    `${API_BASE}/subscriptions/v2/order/${merchantOrderId}/status`,
    { headers: await authHeaders() },
  );
  return data;
}

// Check the mandate/subscription status.
export async function getSubscriptionStatus(merchantSubscriptionId: string) {
  const { data } = await axios.get(
    `${API_BASE}/subscriptions/v2/${merchantSubscriptionId}/status`,
    { headers: await authHeaders() },
  );
  return data;
}

// Phase 2a — notify (24–48h before debit). Returns a notificationId.
export async function notifyRedemption(params: {
  merchantOrderId: string;
  merchantSubscriptionId: string;
  amountPaise: number;
}): Promise<{ notificationId: string; raw: unknown }> {
  const { data } = await axios.post(
    `${API_BASE}/subscriptions/v2/notify`,
    {
      merchantOrderId: params.merchantOrderId,
      merchantSubscriptionId: params.merchantSubscriptionId,
      amount: params.amountPaise,
    },
    { headers: await authHeaders() },
  );
  return {
    notificationId: data?.notificationId ?? data?.data?.notificationId,
    raw: data,
  };
}

// Phase 2b — redeem (actually debit) against a notificationId.
export async function redeem(params: {
  merchantOrderId: string;
  notificationId: string;
}): Promise<unknown> {
  const { data } = await axios.post(
    `${API_BASE}/subscriptions/v2/redeem`,
    {
      merchantOrderId: params.merchantOrderId,
      notificationId: params.notificationId,
    },
    { headers: await authHeaders() },
  );
  return data;
}

// Cancel a mandate.
export async function cancelSubscription(
  merchantSubscriptionId: string,
): Promise<unknown> {
  const { data } = await axios.post(
    `${API_BASE}/subscriptions/v2/${merchantSubscriptionId}/cancel`,
    {},
    { headers: await authHeaders() },
  );
  return data;
}
