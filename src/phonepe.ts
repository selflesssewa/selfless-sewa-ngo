import axios from "axios";
import { getEnvVariable } from "./helper";

// PhonePe Standard Checkout v2 — Autopay / Subscriptions.
// Endpoints verified against:
// https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/setup-subscription/api-integration

const IS_PROD = process.env.PHONEPE_ENV === "PRODUCTION";

const OAUTH_URL = IS_PROD
  ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

const API_BASE = IS_PROD
  ? "https://api.phonepe.com/apis/pg"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox";

// ── OAuth token (cached until ~60s before expiry) ──────────────────────────

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

  cachedToken = {
    token: data.access_token,
    expiresAtMs:
      (data.expires_at ?? Math.floor(Date.now() / 1000) + 3000) * 1000,
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

// ── Types ──────────────────────────────────────────────────────────────────

export type TPhonePeFrequency =
  | "DAILY"
  | "WEEKLY"
  | "FORTNIGHTLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "HALFYEARLY"
  | "YEARLY"
  | "ON_DEMAND";

// ── Phase 1: Setup subscription ────────────────────────────────────────────
// Endpoint: POST /checkout/v2/pay
// Docs: https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/setup-subscription/api-integration

export type TSetupParams = {
  merchantOrderId: string;          // max 63 chars, unique
  merchantSubscriptionId: string;   // max 63 chars, unique
  amountPaise: number;              // per-cycle / first-debit amount in paise
  maxAmountPaise: number;           // mandate ceiling in paise (max 1,500,000 = ₹15,000)
  frequency: TPhonePeFrequency;
  redirectUrl: string;
  expireAtMs?: number;              // mandate validity in ms (optional, max 30 years)
};

export async function setupSubscription(p: TSetupParams): Promise<{
  redirectUrl: string;
  orderId?: string;
  raw: unknown;
}> {
  const payload = {
    merchantOrderId: p.merchantOrderId,
    amount: p.amountPaise,
    paymentFlow: {
      type: "SUBSCRIPTION_CHECKOUT_SETUP",
      merchantUrls: {
        redirectUrl: p.redirectUrl,
      },
      subscriptionDetails: {
        subscriptionType: "RECURRING",
        merchantSubscriptionId: p.merchantSubscriptionId,
        authWorkflowType: "TRANSACTION",
        amountType: "FIXED",
        maxAmount: p.maxAmountPaise,
        frequency: p.frequency,
        productType: "UPI_MANDATE",
        ...(p.expireAtMs
          ? { expireAt: Math.floor(p.expireAtMs / 1000) }
          : {}),
      },
    },
  };

  const { data } = await axios.post(`${API_BASE}/checkout/v2/pay`, payload, {
    headers: await authHeaders(),
  });

  // Response: { orderId, state, expireAt, redirectUrl }
  return {
    redirectUrl: data?.redirectUrl ?? data?.data?.redirectUrl,
    orderId: data?.orderId ?? data?.data?.orderId,
    raw: data,
  };
}

// ── Order status (after mandate setup redirect) ────────────────────────────
// Endpoint: GET /checkout/v2/order/{merchantOrderId}/status
// Docs: https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/order-status

export async function getOrderStatus(merchantOrderId: string) {
  const { data } = await axios.get(
    `${API_BASE}/checkout/v2/order/${merchantOrderId}/status`,
    { headers: await authHeaders() },
  );
  // state: PENDING | COMPLETED | FAILED
  return data;
}

// ── Subscription (mandate) status ─────────────────────────────────────────
// Endpoint: GET /checkout/v2/subscriptions/{merchantSubscriptionId}/status
// Docs: https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/subscription-status

export async function getSubscriptionStatus(merchantSubscriptionId: string) {
  const { data } = await axios.get(
    `${API_BASE}/checkout/v2/subscriptions/${merchantSubscriptionId}/status`,
    { headers: await authHeaders() },
  );
  // state: ACTIVE | CANCELLED | REVOKED
  return data;
}

// ── Phase 2a: Notify (pre-debit notification) ──────────────────────────────
// TODO: Verify exact endpoint path from your PhonePe dashboard docs.
// The docs page for this endpoint returned 404 during fetch; path below is
// based on the v2 URL pattern. Confirm before going live.

export async function notifyRedemption(params: {
  merchantOrderId: string;
  merchantSubscriptionId: string;
  amountPaise: number;
}): Promise<{ notificationId: string; raw: unknown }> {
  const { data } = await axios.post(
    `${API_BASE}/checkout/v2/subscriptions/notify`,
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

// ── Phase 2b: Execute redemption (debit) ──────────────────────────────────
// TODO: Verify exact endpoint path from your PhonePe dashboard docs.
// Same caveat as notifyRedemption above.

export async function redeem(params: {
  merchantOrderId: string;
  notificationId: string;
}): Promise<unknown> {
  const { data } = await axios.post(
    `${API_BASE}/checkout/v2/subscriptions/redeem`,
    {
      merchantOrderId: params.merchantOrderId,
      notificationId: params.notificationId,
    },
    { headers: await authHeaders() },
  );
  return data;
}

// ── Cancel subscription ────────────────────────────────────────────────────
// TODO: Verify exact endpoint path from your PhonePe dashboard docs.
// The cancel/revoke page returned 404 during fetch; path below follows v2 pattern.

export async function cancelSubscription(
  merchantSubscriptionId: string,
): Promise<unknown> {
  const { data } = await axios.post(
    `${API_BASE}/checkout/v2/subscriptions/${merchantSubscriptionId}/cancel`,
    {},
    { headers: await authHeaders() },
  );
  return data;
}
