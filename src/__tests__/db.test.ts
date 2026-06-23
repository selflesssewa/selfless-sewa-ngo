// Integration tests — hit the real Neon DB.
// Skipped automatically when DATABASE_URL is absent.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  addFrequency,
  createSubscription,
  getSubscriptionByMerchantId,
  activateSubscription,
  setSubscriptionStatus,
  createRedemption,
  setRedemptionNotified,
  setRedemptionState,
  getDueSubscriptions,
  bumpNextChargeAt,
} from "../db";
import { Pool } from "pg";
import crypto from "crypto";

const RUN = !!process.env.DATABASE_URL;
const itDB = RUN ? it : it.skip;

let pool: Pool;
const testSubId = crypto.randomUUID().replaceAll("-", "").toUpperCase();
const testOrderId = crypto.randomUUID().replaceAll("-", "").toUpperCase();

beforeAll(() => {
  if (!RUN) return;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
});

afterAll(async () => {
  if (!RUN) return;
  // Clean up test rows.
  await pool.query(
    `DELETE FROM subscriptions WHERE merchant_subscription_id = $1`,
    [testSubId],
  );
  await pool.end();
});

describe("addFrequency (unit — no DB)", () => {
  it("adds 1 month for MONTHLY", () => {
    const from = new Date("2026-01-15");
    const next = addFrequency(from, "MONTHLY");
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(15);
  });

  it("adds 3 months for QUARTERLY", () => {
    const from = new Date("2026-01-01");
    const next = addFrequency(from, "QUARTERLY");
    expect(next.getMonth()).toBe(3); // April
  });

  it("adds 6 months for HALFYEARLY", () => {
    const from = new Date("2026-01-01");
    const next = addFrequency(from, "HALFYEARLY");
    expect(next.getMonth()).toBe(6); // July
  });

  it("adds 1 year for YEARLY", () => {
    const from = new Date("2026-06-17");
    const next = addFrequency(from, "YEARLY");
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(5); // June
  });
});

describe("subscriptions DB", () => {
  itDB("createSubscription inserts a row", async () => {
    const sub = await createSubscription({
      merchantSubscriptionId: testSubId,
      setupOrderId: testOrderId,
      amount: 500,
      frequency: "MONTHLY",
      donorName: "Test Donor",
      donorContact: "9999999999",
    });
    expect(sub.merchant_subscription_id).toBe(testSubId);
    expect(sub.status).toBe("PENDING");
    expect(sub.amount).toBe(500);
    expect(sub.frequency).toBe("MONTHLY");
    expect(sub.donor_name).toBe("Test Donor");
  });

  itDB("getSubscriptionByMerchantId retrieves it", async () => {
    const sub = await getSubscriptionByMerchantId(testSubId);
    expect(sub).not.toBeNull();
    expect(sub!.merchant_subscription_id).toBe(testSubId);
  });

  itDB("getSubscriptionByMerchantId returns null for unknown id", async () => {
    const sub = await getSubscriptionByMerchantId("DOESNOTEXIST");
    expect(sub).toBeNull();
  });

  itDB("activateSubscription marks it ACTIVE and sets next_charge_at", async () => {
    const next = addFrequency(new Date(), "MONTHLY");
    await activateSubscription(testSubId, "PP_SUB_123", next);
    const sub = await getSubscriptionByMerchantId(testSubId);
    expect(sub!.status).toBe("ACTIVE");
    expect(sub!.next_charge_at).not.toBeNull();
  });

  itDB("getDueSubscriptions includes the activated subscription", async () => {
    // Set next_charge_at to the past so it's immediately due.
    const past = new Date(Date.now() - 1000);
    const sub = await getSubscriptionByMerchantId(testSubId);
    await bumpNextChargeAt(sub!.id, past);

    const due = await getDueSubscriptions(100);
    const found = due.find((s) => s.merchant_subscription_id === testSubId);
    expect(found).toBeDefined();
  });

  itDB("setSubscriptionStatus updates status", async () => {
    await setSubscriptionStatus(testSubId, "CANCELLED");
    const sub = await getSubscriptionByMerchantId(testSubId);
    expect(sub!.status).toBe("CANCELLED");
  });
});

describe("redemptions DB", () => {
  let redemptionId: string;

  itDB("createRedemption inserts a row", async () => {
    const sub = await getSubscriptionByMerchantId(testSubId);
    const orderId = crypto.randomUUID().replaceAll("-", "").toUpperCase();
    redemptionId = await createRedemption(sub!.id, orderId, 500);
    expect(typeof redemptionId).toBe("string");
  });

  itDB("setRedemptionNotified updates state and notificationId", async () => {
    await setRedemptionNotified(redemptionId, "NOTIF_001");
    const { rows } = await pool.query(
      `SELECT * FROM redemptions WHERE id = $1`,
      [redemptionId],
    );
    expect(rows[0].state).toBe("NOTIFIED");
    expect(rows[0].notification_id).toBe("NOTIF_001");
  });

  itDB("setRedemptionState to SUCCESS sets completed_at", async () => {
    await setRedemptionState(redemptionId, "SUCCESS");
    const { rows } = await pool.query(
      `SELECT * FROM redemptions WHERE id = $1`,
      [redemptionId],
    );
    expect(rows[0].state).toBe("SUCCESS");
    expect(rows[0].completed_at).not.toBeNull();
  });

  itDB("setRedemptionState to FAILED sets completed_at", async () => {
    const sub = await getSubscriptionByMerchantId(testSubId);
    const orderId2 = crypto.randomUUID().replaceAll("-", "").toUpperCase();
    const id2 = await createRedemption(sub!.id, orderId2, 500);
    await setRedemptionState(id2, "FAILED");
    const { rows } = await pool.query(`SELECT * FROM redemptions WHERE id=$1`, [id2]);
    expect(rows[0].state).toBe("FAILED");
    expect(rows[0].completed_at).not.toBeNull();
  });
});
