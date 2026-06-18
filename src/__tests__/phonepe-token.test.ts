// Unit tests for the PhonePe OAuth token cache.
// Mocks axios so no real network calls are made.
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

// Provide the env vars the module reads at import time.
vi.stubEnv("PHONEPE_CLIENT_ID", "test-client-id");
vi.stubEnv("PHONEPE_CLIENT_SECRET", "test-secret");
vi.stubEnv("PHONEPE_CLIENT_VERSION", "1");
vi.stubEnv("PHONEPE_ENV", "SANDBOX");

// Fresh import each test via module cache busting.
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("PhonePe OAuth token caching", () => {
  it("fetches a token on the first call", async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3000;
    vi.mocked(axios.post).mockResolvedValue({
      data: { access_token: "tok-1", expires_at: expiresAt },
    });
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: "tok-1", expires_at: expiresAt },
    });

    const { setupSubscription } = await import("../phonepe");
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        redirectUrl: "https://phonepe.test/pay",
        orderId: "ORD123",
      },
    });

    const result = await setupSubscription({
      merchantOrderId: "ORD-001",
      merchantSubscriptionId: "SUB-001",
      amountPaise: 50000,
      maxAmountPaise: 50000,
      frequency: "MONTHLY",
      redirectUrl: "https://selflesssewango.com/payment-status",
      expireAtMs: Date.now() + 1000 * 60 * 60 * 24 * 365,
    });

    expect(result.redirectUrl).toBe("https://phonepe.test/pay");
    // axios.post called twice: once for token, once for setup.
    expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(2);
  });

  it("reuses a cached token on the second call", async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3000;
    vi.mocked(axios.post)
      // First call: token fetch
      .mockResolvedValueOnce({ data: { access_token: "tok-cache", expires_at: expiresAt } })
      // Second call: first setup
      .mockResolvedValueOnce({ data: { redirectUrl: "https://a.test" } })
      // Third call: second setup (no new token call)
      .mockResolvedValueOnce({ data: { redirectUrl: "https://b.test" } });

    const { setupSubscription } = await import("../phonepe");
    const params = {
      merchantOrderId: "ORD-002",
      merchantSubscriptionId: "SUB-002",
      amountPaise: 10000,
      maxAmountPaise: 10000,
      frequency: "MONTHLY" as const,
      redirectUrl: "https://selflesssewango.com/payment-status",
      expireAtMs: Date.now() + 1_000_000,
    };

    await setupSubscription(params);
    await setupSubscription({ ...params, merchantOrderId: "ORD-003", merchantSubscriptionId: "SUB-003" });

    // 1 token + 2 setup calls = 3. NOT 4 (no second token fetch).
    expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(3);
  });
});
