// READ-ONLY: for every PENDING donation, ask PhonePe its real state.
// Does NOT modify anything. Run:
//   PHONEPE_CLIENT_ID=.. PHONEPE_CLIENT_SECRET=.. node --env-file=.env.local scripts/check-pending.mjs
import pkg from "pg";
const { Client } = pkg;

const id = process.env.PHONEPE_CLIENT_ID;
const secret = process.env.PHONEPE_CLIENT_SECRET;
const OAUTH = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";
const BASE = "https://api.phonepe.com/apis/pg";

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function token() {
  const r = await fetch(OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      client_version: "1",
      grant_type: "client_credentials",
    }).toString(),
  });
  return (await r.json()).access_token;
}

async function main() {
  await db.connect();
  const { rows } = await db.query(
    "SELECT txn_id, amount, donor_name, created_at FROM donations WHERE status='PENDING' ORDER BY created_at ASC",
  );
  console.log(`PENDING donations in DB: ${rows.length}\n`);

  const tok = await token();
  const tally = { COMPLETED: 0, PENDING: 0, FAILED: 0, OTHER: 0 };
  const stuck = []; // paid at PhonePe but PENDING in our DB
  let stuckAmount = 0;

  for (const d of rows) {
    let state = "OTHER";
    try {
      const r = await fetch(`${BASE}/checkout/v2/order/${d.txn_id}/status`, {
        headers: { Authorization: `O-Bearer ${tok}` },
      });
      const b = await r.json();
      state = b?.state ?? "OTHER";
    } catch {
      state = "ERROR";
    }
    tally[state] = (tally[state] ?? 0) + 1;
    if (state === "COMPLETED") {
      stuck.push({ name: d.donor_name, amount: d.amount, txn: d.txn_id });
      stuckAmount += d.amount;
    }
  }

  console.log("PhonePe real state for those PENDING rows:");
  console.table(tally);
  console.log(
    `\n>>> Actually PAID but stuck PENDING in our DB: ${stuck.length} donations, total Rs.${stuckAmount}`,
  );
  if (stuck.length) console.table(stuck);
  console.log(
    "\n(These are real payments the reconcile cron / webhook would have finalized. No changes made.)",
  );
  await db.end();
}
main().catch((e) => {
  console.error("threw:", e?.message ?? e);
  process.exit(1);
});
