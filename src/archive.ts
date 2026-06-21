import {
  getDonationByTxnId,
  setDonationArchive,
  setDonationArchiveError,
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
