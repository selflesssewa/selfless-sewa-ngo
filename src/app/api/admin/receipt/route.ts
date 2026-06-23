import { isAdmin } from "@/admin";
import { getDonationByTxnId } from "@/db";
import { generateReceiptPdf } from "@/receipt";
import { NextRequest, NextResponse } from "next/server";

// Owner-only: regenerate a receipt PDF on demand from the stored donation row.
// Only works for COMPLETED donations that captured the receipt fields.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const txnId = request.nextUrl.searchParams.get("txnId");
  if (!txnId) return Response.json({ error: "Missing txnId" }, { status: 400 });

  const d = await getDonationByTxnId(txnId);
  if (!d || d.status !== "COMPLETED") {
    return Response.json({ error: "No completed donation" }, { status: 404 });
  }
  if (!(d.donor_name && d.donor_pan && d.donor_contact && d.donor_address)) {
    return Response.json(
      { error: "Donation has no receipt details" },
      { status: 400 },
    );
  }

  const pdf = await generateReceiptPdf({
    txnId: d.txn_id,
    name: d.donor_name,
    pan: d.donor_pan,
    contact: d.donor_contact,
    address: d.donor_address,
    paymentMode: d.payment_mode ?? "",
    amountInRupees: String(d.amount),
  });

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `attachment; filename="receipt_${d.txn_id}.pdf"`,
  );
  return new NextResponse(new Blob([pdf]), { status: 200, headers });
}
