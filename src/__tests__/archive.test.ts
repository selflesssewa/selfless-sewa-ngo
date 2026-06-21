// Unit tests for archiveDonation orchestration. Mocks db/drive/receipt.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db");
vi.mock("../drive");
vi.mock("../receipt");

import { archiveDonation } from "../archive";
import {
  getDonationByTxnId,
  setDonationArchive,
  setDonationArchiveError,
} from "../db";
import { uploadPdfToDrive } from "../drive";
import { generateAcknowledgmentPdf, generateReceiptPdf } from "../receipt";

const completedReceipt = {
  txn_id: "T1",
  amount: 1100,
  status: "COMPLETED",
  donor_name: "Asha",
  donor_contact: "9876543210",
  donor_email: null,
  donor_pan: "ABCDE1234F",
  donor_address: "Pune",
  wants_receipt: true,
  payment_mode: "UPI",
  receipt_no: null,
  drive_file_id: null,
  drive_file_link: null,
  archive_error: null,
  created_at: new Date(),
  updated_at: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(generateReceiptPdf).mockResolvedValue(new Uint8Array([1]));
  vi.mocked(generateAcknowledgmentPdf).mockResolvedValue(new Uint8Array([2]));
  vi.mocked(uploadPdfToDrive).mockResolvedValue({ fileId: "F", link: "L" });
});

describe("archiveDonation", () => {
  it("skips a non-existent donation", async () => {
    vi.mocked(getDonationByTxnId).mockResolvedValue(null);
    await archiveDonation("missing");
    expect(uploadPdfToDrive).not.toHaveBeenCalled();
    expect(setDonationArchive).not.toHaveBeenCalled();
  });

  it("skips a non-COMPLETED donation", async () => {
    vi.mocked(getDonationByTxnId).mockResolvedValue({
      ...completedReceipt,
      status: "PENDING",
    } as any);
    await archiveDonation("T1");
    expect(uploadPdfToDrive).not.toHaveBeenCalled();
  });

  it("is idempotent — skips if already archived", async () => {
    vi.mocked(getDonationByTxnId).mockResolvedValue({
      ...completedReceipt,
      drive_file_id: "already",
    } as any);
    await archiveDonation("T1");
    expect(uploadPdfToDrive).not.toHaveBeenCalled();
  });

  it("uses the receipt PDF + receipt_ filename for receipt donations", async () => {
    vi.mocked(getDonationByTxnId).mockResolvedValue(completedReceipt as any);
    await archiveDonation("T1");
    expect(generateReceiptPdf).toHaveBeenCalledTimes(1);
    expect(generateAcknowledgmentPdf).not.toHaveBeenCalled();
    const filename = vi.mocked(uploadPdfToDrive).mock.calls[0][1];
    expect(filename).toMatch(/^receipt_.*_T1\.pdf$/);
    expect(setDonationArchive).toHaveBeenCalledWith("T1", "F", "L");
  });

  it("uses the acknowledgment PDF + ack_ filename for non-receipt donations", async () => {
    vi.mocked(getDonationByTxnId).mockResolvedValue({
      ...completedReceipt,
      wants_receipt: false,
      donor_pan: null,
      donor_address: null,
    } as any);
    await archiveDonation("T1");
    expect(generateAcknowledgmentPdf).toHaveBeenCalledTimes(1);
    expect(generateReceiptPdf).not.toHaveBeenCalled();
    const filename = vi.mocked(uploadPdfToDrive).mock.calls[0][1];
    expect(filename).toMatch(/^ack_.*_T1\.pdf$/);
  });

  it("falls back to acknowledgment if a receipt donation is missing PAN/address", async () => {
    vi.mocked(getDonationByTxnId).mockResolvedValue({
      ...completedReceipt,
      donor_address: null,
    } as any);
    await archiveDonation("T1");
    expect(generateAcknowledgmentPdf).toHaveBeenCalledTimes(1);
    expect(generateReceiptPdf).not.toHaveBeenCalled();
  });

  it("records archive_error and never throws when the upload fails", async () => {
    vi.mocked(getDonationByTxnId).mockResolvedValue(completedReceipt as any);
    vi.mocked(uploadPdfToDrive).mockRejectedValue(new Error("Drive down"));
    await expect(archiveDonation("T1")).resolves.toBeUndefined();
    expect(setDonationArchive).not.toHaveBeenCalled();
    expect(setDonationArchiveError).toHaveBeenCalledWith("T1", "Drive down");
  });
});
