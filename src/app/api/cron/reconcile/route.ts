import { callStatusApi } from "@/helper";
import { finalizeDonation, getStalePendingDonations } from "@/db";
import { NextRequest } from "next/server";

// Vercel Cron. Finalizes one-time donations whose donor closed the tab before
// the status page could confirm them. Protected by CRON_SECRET.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stale = await getStalePendingDonations(15);
  const results: Array<{ txnId: string; state: string }> = [];

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
        results.push({ txnId: d.txn_id, state });
      } else {
        results.push({ txnId: d.txn_id, state: state ?? "PENDING" });
      }
    } catch (e) {
      console.error("Reconcile error for", d.txn_id, e);
      results.push({ txnId: d.txn_id, state: "ERROR" });
    }
  }

  return Response.json({ checked: stale.length, results });
}
