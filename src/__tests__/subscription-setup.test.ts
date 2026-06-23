// Unit tests for the /api/subscription/setup route validation.
// Mocks DB + PhonePe so they never hit the network.
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

vi.mock("@/db", () => ({
  createSubscription: vi.fn().mockResolvedValue({ id: "db-id" }),
}));

vi.mock("@/phonepe", () => ({
  setupSubscription: vi.fn().mockResolvedValue({
    redirectUrl: "https://phonepe.test/redirect",
    raw: {},
  }),
}));

// Import deferred until test runs (mocks must be declared first).
let POST: any;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/subscription/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => vi.clearAllMocks());

beforeAll(async () => {
  const mod = await import("../app/api/subscription/setup/route");
  POST = mod.POST;
});

describe("POST /api/subscription/setup — validation", () => {
  it("rejects a negative amount", async () => {
    const res = await POST(makeRequest({ amount: -100, frequency: "MONTHLY" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid amount");
  });

  it("rejects zero amount", async () => {
    const res = await POST(makeRequest({ amount: 0, frequency: "MONTHLY" }));
    expect(res.status).toBe(400);
  });

  it("rejects a float amount", async () => {
    const res = await POST(makeRequest({ amount: 99.5, frequency: "MONTHLY" }));
    expect(res.status).toBe(400);
  });

  it("rejects amount over 10 lakh", async () => {
    const res = await POST(makeRequest({ amount: 10_00_001, frequency: "MONTHLY" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid frequency", async () => {
    const res = await POST(makeRequest({ amount: 500, frequency: "DAILY" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid frequency");
  });

  it("rejects a completely missing frequency", async () => {
    const res = await POST(makeRequest({ amount: 500 }));
    expect(res.status).toBe(400);
  });

  it("rejects a non-JSON body", async () => {
    const req = new Request("http://localhost/api/subscription/setup", {
      method: "POST",
      body: "not json",
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid body");
  });

  it("accepts all valid frequencies", async () => {
    const { setupSubscription } = await import("@/phonepe");
    for (const freq of ["MONTHLY", "QUARTERLY", "HALFYEARLY", "YEARLY"]) {
      vi.mocked(setupSubscription).mockResolvedValue({
        redirectUrl: "https://phonepe.test/redirect",
        raw: {},
      });
      const res = await POST(
        makeRequest({ amount: 100, frequency: freq, name: "A", contact: "9999999999" }),
      );
      expect(res.status).toBe(200);
    }
  });

  it("returns redirectUrl on success", async () => {
    const res = await POST(
      makeRequest({ amount: 500, frequency: "MONTHLY", name: "A", contact: "9999999999" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectUrl).toBe("https://phonepe.test/redirect");
    expect(typeof body.merchantSubscriptionId).toBe("string");
  });

  it("returns 502 when PhonePe returns no redirectUrl", async () => {
    const { setupSubscription } = await import("@/phonepe");
    vi.mocked(setupSubscription).mockResolvedValue({ redirectUrl: undefined as any, raw: {} });
    const res = await POST(
      makeRequest({ amount: 500, frequency: "MONTHLY" }),
    );
    expect(res.status).toBe(502);
  });
});
