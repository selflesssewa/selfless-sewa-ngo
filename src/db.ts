import { Pool } from "pg";
import { getEnvVariable } from "./helper";
import type { TFrequency } from "./stores/donationStore";

// Single pooled connection, reused across serverless invocations.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: getEnvVariable("DATABASE_URL"),
      // Most hosted Postgres (Supabase/Neon/Vercel) require SSL.
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global._pgPool;
}

export type TSubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "CANCELLED"
  | "FAILED";

export type TSubscription = {
  id: string;
  merchant_subscription_id: string;
  phonepe_subscription_id: string | null;
  setup_order_id: string;
  donor_name: string | null;
  donor_contact: string | null;
  donor_email: string | null;
  donor_pan: string | null;
  donor_address: string | null;
  amount: number;
  frequency: TFrequency;
  status: TSubscriptionStatus;
  next_charge_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type TNewSubscription = {
  merchantSubscriptionId: string;
  setupOrderId: string;
  amount: number;
  frequency: TFrequency;
  donorName?: string;
  donorContact?: string;
  donorEmail?: string;
  donorPan?: string;
  donorAddress?: string;
};

export async function createSubscription(
  s: TNewSubscription,
): Promise<TSubscription> {
  const { rows } = await getPool().query<TSubscription>(
    `INSERT INTO subscriptions
       (merchant_subscription_id, setup_order_id, amount, frequency,
        donor_name, donor_contact, donor_email, donor_pan, donor_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      s.merchantSubscriptionId,
      s.setupOrderId,
      s.amount,
      s.frequency,
      s.donorName ?? null,
      s.donorContact ?? null,
      s.donorEmail ?? null,
      s.donorPan ?? null,
      s.donorAddress ?? null,
    ],
  );
  return rows[0];
}

export async function getSubscriptionByMerchantId(
  merchantSubscriptionId: string,
): Promise<TSubscription | null> {
  const { rows } = await getPool().query<TSubscription>(
    `SELECT * FROM subscriptions WHERE merchant_subscription_id = $1`,
    [merchantSubscriptionId],
  );
  return rows[0] ?? null;
}

export async function activateSubscription(
  merchantSubscriptionId: string,
  phonepeSubscriptionId: string | null,
  nextChargeAt: Date,
): Promise<void> {
  await getPool().query(
    `UPDATE subscriptions
       SET status = 'ACTIVE',
           phonepe_subscription_id = COALESCE($2, phonepe_subscription_id),
           next_charge_at = $3,
           updated_at = now()
     WHERE merchant_subscription_id = $1`,
    [merchantSubscriptionId, phonepeSubscriptionId, nextChargeAt],
  );
}

export async function setSubscriptionStatus(
  merchantSubscriptionId: string,
  status: TSubscriptionStatus,
): Promise<void> {
  await getPool().query(
    `UPDATE subscriptions SET status = $2, updated_at = now()
     WHERE merchant_subscription_id = $1`,
    [merchantSubscriptionId, status],
  );
}

// Active subscriptions whose next charge is due (used by the cron).
export async function getDueSubscriptions(
  limit = 50,
): Promise<TSubscription[]> {
  const { rows } = await getPool().query<TSubscription>(
    `SELECT * FROM subscriptions
       WHERE status = 'ACTIVE' AND next_charge_at <= now()
       ORDER BY next_charge_at ASC
       LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function bumpNextChargeAt(
  subscriptionId: string,
  nextChargeAt: Date,
): Promise<void> {
  await getPool().query(
    `UPDATE subscriptions SET next_charge_at = $2, updated_at = now()
     WHERE id = $1`,
    [subscriptionId, nextChargeAt],
  );
}

export type TRedemptionState =
  | "CREATED"
  | "NOTIFIED"
  | "SUCCESS"
  | "FAILED";

export async function createRedemption(
  subscriptionId: string,
  merchantOrderId: string,
  amount: number,
): Promise<string> {
  const { rows } = await getPool().query<{ id: string }>(
    `INSERT INTO redemptions (subscription_id, merchant_order_id, amount)
     VALUES ($1,$2,$3) RETURNING id`,
    [subscriptionId, merchantOrderId, amount],
  );
  return rows[0].id;
}

export async function setRedemptionNotified(
  redemptionId: string,
  notificationId: string,
): Promise<void> {
  await getPool().query(
    `UPDATE redemptions SET state = 'NOTIFIED', notification_id = $2
     WHERE id = $1`,
    [redemptionId, notificationId],
  );
}

export async function setRedemptionState(
  redemptionId: string,
  state: TRedemptionState,
): Promise<void> {
  await getPool().query(
    `UPDATE redemptions
       SET state = $2,
           completed_at = CASE WHEN $2 IN ('SUCCESS','FAILED') THEN now() ELSE completed_at END
     WHERE id = $1`,
    [redemptionId, state],
  );
}

// Compute the next charge date for a given frequency.
export function addFrequency(from: Date, frequency: TFrequency): Date {
  const d = new Date(from);
  switch (frequency) {
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      break;
    case "HALFYEARLY":
      d.setMonth(d.getMonth() + 6);
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

// ---- One-time donations (donor ledger, #9A) ----

export type TDonationStatus = "PENDING" | "COMPLETED" | "FAILED";

export type TDonation = {
  id: string;
  txn_id: string;
  amount: number;
  status: TDonationStatus;
  donor_name: string | null;
  donor_contact: string | null;
  donor_email: string | null;
  donor_pan: string | null;
  donor_address: string | null;
  wants_receipt: boolean;
  payment_mode: string | null;
  receipt_no: string | null;
  drive_file_id: string | null;
  drive_file_link: string | null;
  archive_error: string | null;
  created_at: Date;
  updated_at: Date;
};

export type TNewDonation = {
  txnId: string;
  amount: number;
  wantsReceipt: boolean;
  donorName?: string | null;
  donorContact?: string | null;
  donorEmail?: string | null;
  donorPan?: string | null;
  donorAddress?: string | null;
};

// Insert a PENDING row when a payment is initiated. Idempotent on txn_id.
export async function insertPendingDonation(d: TNewDonation): Promise<void> {
  await getPool().query(
    `INSERT INTO donations
       (txn_id, amount, wants_receipt,
        donor_name, donor_contact, donor_email, donor_pan, donor_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (txn_id) DO NOTHING`,
    [
      d.txnId,
      d.amount,
      d.wantsReceipt,
      d.donorName ?? null,
      d.donorContact ?? null,
      d.donorEmail ?? null,
      d.donorPan ?? null,
      d.donorAddress ?? null,
    ],
  );
}

// Finalize a donation once PhonePe confirms the outcome. Only moves a row out
// of PENDING (so repeated status polls / the cron stay idempotent).
export async function finalizeDonation(
  txnId: string,
  status: "COMPLETED" | "FAILED",
  paymentMode: string | null,
): Promise<void> {
  await getPool().query(
    `UPDATE donations
       SET status = $2,
           payment_mode = COALESCE($3, payment_mode),
           updated_at = now()
     WHERE txn_id = $1 AND status = 'PENDING'`,
    [txnId, status, paymentMode],
  );
}

export async function getDonationByTxnId(
  txnId: string,
): Promise<TDonation | null> {
  const { rows } = await getPool().query<TDonation>(
    `SELECT * FROM donations WHERE txn_id = $1`,
    [txnId],
  );
  return rows[0] ?? null;
}

export async function listDonations(limit = 200): Promise<TDonation[]> {
  const { rows } = await getPool().query<TDonation>(
    `SELECT * FROM donations ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows;
}

// PENDING rows older than `minAgeMinutes` that the reconcile cron should check.
export async function getStalePendingDonations(
  minAgeMinutes = 15,
): Promise<TDonation[]> {
  const { rows } = await getPool().query<TDonation>(
    `SELECT * FROM donations
     WHERE status = 'PENDING' AND created_at < now() - ($1 || ' minutes')::interval
     ORDER BY created_at ASC
     LIMIT 100`,
    [String(minAgeMinutes)],
  );
  return rows;
}

// Record a successful Drive archive on the donation row.
export async function setDonationArchive(
  txnId: string,
  driveFileId: string,
  driveFileLink: string,
): Promise<void> {
  await getPool().query(
    `UPDATE donations
       SET drive_file_id = $2, drive_file_link = $3,
           archive_error = NULL, updated_at = now()
     WHERE txn_id = $1`,
    [txnId, driveFileId, driveFileLink],
  );
}

// Record an archive failure (so the retry sweep can see what went wrong).
export async function setDonationArchiveError(
  txnId: string,
  error: string,
): Promise<void> {
  await getPool().query(
    `UPDATE donations SET archive_error = $2, updated_at = now()
     WHERE txn_id = $1`,
    [txnId, error.slice(0, 500)],
  );
}

// COMPLETED donations not yet archived to Drive (for the retry sweep).
export async function getUnarchivedDonations(
  limit = 50,
): Promise<TDonation[]> {
  const { rows } = await getPool().query<TDonation>(
    `SELECT * FROM donations
     WHERE status = 'COMPLETED' AND drive_file_id IS NULL
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );
  return rows;
}
