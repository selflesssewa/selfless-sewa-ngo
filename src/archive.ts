import {
  getDonationByTxnId,
  setDonationArchive,
  setDonationArchiveError,
  getRedemptionByMerchantOrderId,
  setRedemptionArchive,
  setRedemptionArchiveError,
  getPool,
} from "./db";
import { uploadPdfToDrive } from "./drive";
import { generateAcknowledgmentPdf, generateReceiptPdf } from "./receipt";

const safeName = (s: string | null | undefined) =>
  (s || "").replace(/[^a-zA-Z0-9]+/g, "").slice(0, 30) || "donor";

// Archive a single donation's PDF to Drive. Idempotent (skips if already
// archived or not completed) and self-contained: records archive_error on
// failure so the retry cron can re-attempt. Never throws.
export async function archiveDonation(txnId: string): Promise<void> {
  const d = await getDonationByTxnId(txnId);
  if (!d || d.status !== "COMPLETED" || d.drive_file_id) return;

  try {
    const date = new Date(d.created_at).toISOString().slice(0, 10);
    const amount = String(d.amount);
    const isReceipt =
      d.wants_receipt &&
      !!d.donor_name &&
      !!d.donor_pan &&
      !!d.donor_contact &&
      !!d.donor_address;

    let pdf: Uint8Array;
    let filename: string;

    if (isReceipt) {
      pdf = await generateReceiptPdf({
        txnId: d.txn_id,
        name: d.donor_name!,
        pan: d.donor_pan!,
        contact: d.donor_contact!,
        address: d.donor_address!,
        paymentMode: d.payment_mode ?? "",
        amountInRupees: amount,
      });
      filename = `receipt_${date}_${safeName(d.donor_name)}_${d.txn_id}.pdf`;
    } else {
      pdf = await generateAcknowledgmentPdf({
        txnId: d.txn_id,
        name: d.donor_name ?? "Anonymous",
        contact: d.donor_contact ?? "-",
        paymentMode: d.payment_mode ?? "",
        amountInRupees: amount,
      });
      filename = `ack_${date}_${safeName(d.donor_name)}_${d.txn_id}.pdf`;
    }

    const { fileId, link } = await uploadPdfToDrive(pdf, filename);
    await setDonationArchive(d.txn_id, fileId, link);
  } catch (e) {
    await setDonationArchiveError(
      d.txn_id,
      e instanceof Error ? e.message : String(e),
    );
  }
}

// Archive a single redemption's receipt to Drive (Phase 3c).
// Called when redemption state transitions to SUCCESS. Idempotent.
export async function archiveRedemption(
  redemptionId: string,
  merchantOrderId: string,
): Promise<void> {
  const r = await getRedemptionByMerchantOrderId(merchantOrderId);
  if (!r || r.state !== "SUCCESS" || r.drive_file_id || r.id !== redemptionId)
    return;

  try {
    // Get subscription details for receipt
    const pool = getPool();

    const subResult = await pool.query(
      `SELECT donor_name, donor_pan, donor_contact, donor_address, amount
       FROM subscriptions WHERE id = $1`,
      [r.subscription_id],
    );
    const sub = subResult.rows[0];
    if (!sub) throw new Error("Subscription not found");

    const date = new Date(r.attempted_at || new Date())
      .toISOString()
      .slice(0, 10);
    const amount = String(sub.amount);
    const txnId = merchantOrderId;

    // Generate receipt (recurring subscriptions always have full details)
    const pdf = await generateReceiptPdf({
      txnId,
      name: sub.donor_name || "Anonymous",
      pan: sub.donor_pan || "-",
      contact: sub.donor_contact || "-",
      address: sub.donor_address || "-",
      paymentMode: "UPI Recurring Mandate",
      amountInRupees: amount,
    });

    const filename = `recurring_receipt_${date}_${safeName(sub.donor_name)}_${txnId}.pdf`;
    const { fileId, link } = await uploadPdfToDrive(pdf, filename);
    await setRedemptionArchive(redemptionId, fileId, link);
  } catch (e) {
    await setRedemptionArchiveError(
      redemptionId,
      e instanceof Error ? e.message : String(e),
    );
  }
}
