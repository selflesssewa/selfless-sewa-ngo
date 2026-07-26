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
        // PhonePe expects epoch MILLISECONDS here (not seconds). Sending seconds
        // is read as a 1970 date -> INVALID_SUBSCRIPTION_EXPIRY in production.
        ...(p.expireAtMs ? { expireAt: p.expireAtMs } : {}),
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

// ── One-time payment (v2 Standard Checkout) ────────────────────────────────
// Endpoint: POST /checkout/v2/pay with a PG_CHECKOUT flow. Uses the same OAuth
// credentials as autopay — no separate v1 salt-key needed.

export async function createPayment(p: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
}): Promise<{ redirectUrl: string; orderId?: string; raw: unknown }> {
  const payload = {
    merchantOrderId: p.merchantOrderId,
    amount: p.amountPaise,
    paymentFlow: {
      type: "PG_CHECKOUT",
      merchantUrls: { redirectUrl: p.redirectUrl },
    },
  };

  const { data } = await axios.post(`${API_BASE}/checkout/v2/pay`, payload, {
    headers: await authHeaders(),
  });

  // Response: { orderId, state, redirectUrl }
  return {
    redirectUrl: data?.redirectUrl ?? data?.data?.redirectUrl,
    orderId: data?.orderId ?? data?.data?.orderId,
    raw: data,
  };
}

// One-time payment status, normalized to the v1-compatible shape the existing
// callers (status route, reconcile cron, receipt route) already expect:
//   { data: { data: { state, paymentInstrument: { type } } } }
// so they keep working unchanged after the v1 -> v2 migration.
export async function callStatusApi(merchantOrderId: string) {
  const order = await getOrderStatus(merchantOrderId);
  const state = order?.state ?? order?.data?.state;
  const paymentMode =
    order?.paymentDetails?.[0]?.paymentMode ??
    order?.data?.paymentDetails?.[0]?.paymentMode ??
    null;
  return {
    data: {
      success: state === "COMPLETED",
      data: {
        state,
        paymentInstrument: { type: paymentMode },
      },
    },
  };
}

// ── Subscription (mandate) status ─────────────────────────────────────────
// Endpoint: GET /subscriptions/v2/{merchantSubscriptionId}/status
// (verified against live docs, Jul 2026 — NOT the /checkout/v2 path).

export async function getSubscriptionStatus(merchantSubscriptionId: string) {
  const { data } = await axios.get(
    `${API_BASE}/subscriptions/v2/${merchantSubscriptionId}/status`,
    { headers: await authHeaders() },
  );
  // state: ACTIVE | CANCELLED | REVOKED
  return data;
}

// ── Recurring debit: Notify (+ auto-execute) ───────────────────────────────
// Endpoint: POST /subscriptions/v2/notify  (verified against live docs, Jul 2026:
//   developer.phonepe.com/payment-gateway/autopay/api-integration/api-reference/redemption-notify)
// With autoDebit:true PhonePe sends the NPCI pre-debit notification AND executes
// the debit itself — no separate redeem() call needed. The final state
// (COMPLETED/FAILED) arrives via the webhook, or the reconcile poll.
// Response: { orderId, state: "NOTIFICATION_IN_PROGRESS", expireAt, ... }.

export async function notifyRedemption(params: {
  merchantOrderId: string;
  merchantSubscriptionId: string;
  amountPaise: number;
  expireAtMs: number;
}): Promise<{ orderId?: string; state?: string; raw: unknown }> {
  const { data } = await axios.post(
    `${API_BASE}/subscriptions/v2/notify`,
    {
      merchantOrderId: params.merchantOrderId,
      amount: params.amountPaise,
      expireAt: params.expireAtMs,
      paymentFlow: {
        type: "SUBSCRIPTION_REDEMPTION",
        merchantSubscriptionId: params.merchantSubscriptionId,
        redemptionRetryStrategy: "STANDARD",
        autoDebit: true,
      },
    },
    { headers: await authHeaders() },
  );
  return {
    orderId: data?.orderId ?? data?.data?.orderId,
    state: data?.state ?? data?.data?.state,
    raw: data,
  };
}

// ── Recurring debit: Execute (only needed if autoDebit was false) ──────────
// Endpoint: POST /subscriptions/v2/redeem  (body is just { merchantOrderId };
// there is NO notificationId in v2). Kept for completeness — the notify above
// uses autoDebit:true, so this is not called in the normal flow.
// Response: { state: "PENDING", transactionId }.

export async function redeem(params: {
  merchantOrderId: string;
}): Promise<{ state?: string; transactionId?: string; raw: unknown }> {
  const { data } = await axios.post(
    `${API_BASE}/subscriptions/v2/redeem`,
    { merchantOrderId: params.merchantOrderId },
    { headers: await authHeaders() },
  );
  return {
    state: data?.state ?? data?.data?.state,
    transactionId: data?.transactionId ?? data?.data?.transactionId,
    raw: data,
  };
}

// ── Recurring debit: Order status (reconcile backstop for the webhook) ─────
// Endpoint: GET /subscriptions/v2/order/{merchantOrderId}/status?details=true
// (subscriptions-specific — NOT the /checkout/v2/order path). Returns
// { state: COMPLETED | FAILED | PENDING, errorCode?, ... }.

export async function getRedemptionOrderStatus(merchantOrderId: string) {
  const { data } = await axios.get(
    `${API_BASE}/subscriptions/v2/order/${merchantOrderId}/status?details=true`,
    { headers: await authHeaders() },
  );
  return data as { state?: string; errorCode?: string; [k: string]: unknown };
}

// ── Cancel subscription ────────────────────────────────────────────────────
// Endpoint: POST /subscriptions/v2/{merchantSubscriptionId}/cancel
// (verified against live docs, Jul 2026). Returns 204 No Content on success.

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
