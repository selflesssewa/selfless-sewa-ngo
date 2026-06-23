import {
  finalizeDonation,
  getDueSubscriptions,
  getStalePendingDonations,
  getUnarchivedDonations,
  getUnarchivedRedemptions,
} from "@/db";
import { chargeSubscription } from "@/charge";
import { archiveDonation, archiveRedemption } from "@/archive";
import { callStatusApi } from "@/phonepe";
import { NextRequest } from "next/server";

// Single daily maintenance cron — the Vercel Hobby plan only allows daily cron
// jobs (and a small number of them), so we run all four sweeps in one pass:
//   1. charge due recurring mandates
//   2. reconcile one-time payments left PENDING (closed tabs)
//   3. retry one-time Drive archiving
//   4. retry recurring receipt archiving
// Each is idempotent and self-contained. Protected by CRON_SECRET (Vercel sends
// it automatically). The granular /api/cron/* endpoints remain for manual use.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary: Record<string, unknown> = {};

  // 1. Charge due recurring mandates.
  try {
    const due = await getDueSubscriptions();
    let charged = 0;
    for (const sub of due) {
      const r = await chargeSubscription(sub);
      if (r.ok) charged++;
    }
    summary.charge = { due: due.length, charged };
  } catch (e) {
    summary.charge = { error: e instanceof Error ? e.message : String(e) };
  }

  // 2. Reconcile stale PENDING one-time donations.
  try {
    const stale = await getStalePendingDonations(15);
    let finalized = 0;
    for (const d of stale) {
      try {
        const { data } = await callStatusApi(d.txn_id);
        const state: string | undefined = data?.data?.state;
        if (state === "COMPLETED" || state === "FAILED") {
          await finalizeDonation(
            d.txn_id,
            state,
            data?.data?.paymentInstrument?.type ?? null,
          );
          finalized++;
        }
      } catch (e) {
        console.error("Daily reconcile error for", d.txn_id, e);
      }
    }
    summary.reconcile = { checked: stale.length, finalized };
  } catch (e) {
    summary.reconcile = { error: e instanceof Error ? e.message : String(e) };
  }

  // 3. Retry one-time Drive archiving.
  try {
    const pending = await getUnarchivedDonations(50);
    for (const d of pending) await archiveDonation(d.txn_id);
    summary.archive = { attempted: pending.length };
  } catch (e) {
    summary.archive = { error: e instanceof Error ? e.message : String(e) };
  }

  // 4. Retry recurring receipt archiving.
  try {
    const pending = await getUnarchivedRedemptions(50);
    for (const r of pending) await archiveRedemption(r.id, r.merchant_order_id);
    summary.reconcileReceipts = { attempted: pending.length };
  } catch (e) {
    summary.reconcileReceipts = {
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return Response.json({ ok: true, ...summary });
}
