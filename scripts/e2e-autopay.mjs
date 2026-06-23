// End-to-end test for the Autopay recurring-charge pipeline.
//
//   npm run test:e2e:autopay
//
// What it covers (the parts that DON'T need a human in PhonePe's UI):
//   1. Seeds an ACTIVE subscription with next_charge_at in the past.
//      (The mandate setup + authorization is browser-only and can't be scripted;
//       we start from the state the app would be in right after activation.)
//   2. Hits /api/cron/charge       → expects a NOTIFIED redemption.   (Phase 3a)
//   3. Hits /api/webhook/phonepe   → expects SUCCESS + receipt archived. (Phase 4 + 3b/3c)
//   4. Re-sends the webhook        → expects idempotent no-op.
//   5. Cleans up the rows it created (unless KEEP=1).
//
// Env (from .env.local): DATABASE_URL, CRON_SECRET.
// Override the target with BASE_URL (default http://localhost:3000).
// Pass --no-archive to skip asserting Drive fields (e.g. Drive creds absent locally).

import pkg from "pg";
const { Client } = pkg;

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "dev-cron-secret-change-me";
const KEEP = process.env.KEEP === "1";
const SKIP_ARCHIVE = process.argv.includes("--no-archive");

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("✗ No DATABASE_URL set. Run with: npm run test:e2e:autopay");
  process.exit(1);
}

const db = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

// ── tiny test harness ──────────────────────────────────────────────
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "  ✓" : "  ✗"} ${msg}`);
  if (!cond) failures++;
};
const step = (msg) => console.log(`\n▶ ${msg}`);

const rand = () =>
  (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
    .replaceAll("-", "")
    .toUpperCase();

async function api(path, init) {
  const res = await fetch(`${BASE_URL}${path}`, init);
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

// ── the test ───────────────────────────────────────────────────────
const merchantSubscriptionId = `E2E${rand()}`;
const setupOrderId = `E2E${rand()}`;
let subscriptionId; // db uuid
let merchantOrderId; // the charge's order id, read back after cron

async function main() {
  await db.connect();
  console.log(`E2E Autopay — target ${BASE_URL}`);

  // 1. Seed an ACTIVE subscription due for charge right now.
  step("Seed ACTIVE subscription (next_charge_at in the past)");
  const seed = await db.query(
    `INSERT INTO subscriptions
       (merchant_subscription_id, phonepe_subscription_id, setup_order_id,
        donor_name, donor_contact, donor_email, donor_pan, donor_address,
        amount, frequency, status, next_charge_at)
     VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,'MONTHLY','ACTIVE', now() - interval '1 minute')
     RETURNING id`,
    [
      merchantSubscriptionId,
      setupOrderId,
      "E2E Test Donor",
      "9999999999",
      "e2e@test.local",
      "ABCDE1234F",
      "1 Test Street, Test City",
      5,
    ],
  );
  subscriptionId = seed.rows[0].id;
  ok(!!subscriptionId, `subscription seeded (${merchantSubscriptionId})`);

  // 2. Cron: notify + redeem → NOTIFIED redemption.
  step("POST-less GET /api/cron/charge  (Phase 3a)");
  const cron = await api("/api/cron/charge", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  ok(cron.status === 200, `cron returned 200 (got ${cron.status})`);
  ok(cron.body?.processed >= 1, `cron processed >= 1 (got ${cron.body?.processed})`);
  const mine = cron.body?.results?.find((r) => r.sub === merchantSubscriptionId);
  ok(!!mine?.ok, "our subscription charged ok");

  const red = await db.query(
    `SELECT id, merchant_order_id, state FROM redemptions
      WHERE subscription_id = $1 ORDER BY attempted_at DESC LIMIT 1`,
    [subscriptionId],
  );
  ok(red.rowCount === 1, "exactly one redemption created");
  ok(red.rows[0]?.state === "NOTIFIED", `redemption state NOTIFIED (got ${red.rows[0]?.state})`);
  merchantOrderId = red.rows[0]?.merchant_order_id;
  ok(!!merchantOrderId, `merchant_order_id captured (${merchantOrderId})`);

  // Cron should also have bumped next_charge_at into the future.
  const bumped = await db.query(
    `SELECT next_charge_at > now() AS future FROM subscriptions WHERE id = $1`,
    [subscriptionId],
  );
  ok(bumped.rows[0]?.future === true, "next_charge_at bumped to the future");

  // 3. Webhook: SUCCESS → finalize + archive.
  step("POST /api/webhook/phonepe  status=SUCCESS  (Phase 4 + 3b/3c)");
  const hook = await api("/api/webhook/phonepe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantOrderId, status: "SUCCESS" }),
  });
  ok(hook.status === 200, `webhook returned 200 (got ${hook.status})`);
  ok(hook.body?.state === "SUCCESS", `webhook state SUCCESS (got ${hook.body?.state})`);

  // Archiving is fire-and-forget; poll until it lands (or errors), up to ~20s.
  let row;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const fin = await db.query(
      `SELECT state, receipt_issued, drive_file_id, drive_file_link, archive_error
         FROM redemptions WHERE merchant_order_id = $1`,
      [merchantOrderId],
    );
    row = fin.rows[0];
    // 'PENDING' is the in-flight archive claim, not a finished upload — keep waiting.
    const done = row?.drive_file_id && row.drive_file_id !== "PENDING";
    if (done || row?.archive_error || SKIP_ARCHIVE) break;
  }
  ok(row?.state === "SUCCESS", `redemption finalized SUCCESS (got ${row?.state})`);

  if (SKIP_ARCHIVE) {
    console.log("  · archive assertions skipped (--no-archive)");
    if (row?.archive_error) console.log(`    note: archive_error = ${row.archive_error}`);
  } else {
    ok(row?.receipt_issued === true, "receipt_issued = true");
    ok(!!row?.drive_file_id, "drive_file_id populated");
    ok(!!row?.drive_file_link, "drive_file_link populated");
    if (row?.archive_error) ok(false, `unexpected archive_error: ${row.archive_error}`);
  }

  // 4. Idempotency: re-send the webhook, state must not flip.
  step("POST /api/webhook/phonepe again  (idempotency)");
  const hook2 = await api("/api/webhook/phonepe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantOrderId, status: "FAILED" }),
  });
  ok(hook2.status === 200, `re-webhook returned 200 (got ${hook2.status})`);
  const after = await db.query(
    `SELECT state FROM redemptions WHERE merchant_order_id = $1`,
    [merchantOrderId],
  );
  ok(after.rows[0]?.state === "SUCCESS", "state still SUCCESS after duplicate webhook");

  if (SKIP_ARCHIVE) return;

  // 5. Receipt retry cron: simulate a failed archive, confirm the cron re-archives.
  step("GET /api/cron/reconcile-receipts  (archive retry)");
  await db.query(
    `UPDATE redemptions
        SET drive_file_id = NULL, drive_file_link = NULL,
            receipt_issued = false, archive_error = 'simulated failure'
      WHERE merchant_order_id = $1`,
    [merchantOrderId],
  );
  const recon = await api("/api/cron/reconcile-receipts", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  ok(recon.status === 200, `reconcile returned 200 (got ${recon.status})`);
  ok(recon.body?.attempted >= 1, `reconcile attempted >= 1 (got ${recon.body?.attempted})`);

  // Poll for re-archive to land.
  let recovered;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const q = await db.query(
      `SELECT drive_file_id, receipt_issued FROM redemptions WHERE merchant_order_id = $1`,
      [merchantOrderId],
    );
    recovered = q.rows[0];
    if (recovered?.drive_file_id && recovered.drive_file_id !== "PENDING") break;
  }
  ok(!!recovered?.drive_file_id, "drive_file_id re-populated by retry cron");
  ok(recovered?.receipt_issued === true, "receipt_issued = true after retry");
}

async function cleanup() {
  if (KEEP) {
    console.log("\n· KEEP=1 — leaving rows in place for inspection");
    console.log(`  subscription: ${merchantSubscriptionId}`);
    if (merchantOrderId) console.log(`  redemption order: ${merchantOrderId}`);
    return;
  }
  if (subscriptionId) {
    // redemptions cascade-delete with the subscription
    await db.query(`DELETE FROM subscriptions WHERE id = $1`, [subscriptionId]);
    console.log("\n· cleaned up test rows");
  }
}

try {
  await main();
} catch (e) {
  failures++;
  console.error("\n✗ threw:", e?.message ?? e);
} finally {
  try {
    await cleanup();
  } catch (e) {
    console.error("cleanup error:", e?.message ?? e);
  }
  await db.end();
}

console.log(`\n${failures === 0 ? "✅ PASS" : `❌ FAIL (${failures} assertion${failures === 1 ? "" : "s"})`}`);
process.exit(failures === 0 ? 0 : 1);
