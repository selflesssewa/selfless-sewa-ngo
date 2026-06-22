import { getDueSubscriptions } from "@/db";
import { chargeSubscription } from "@/charge";
import { NextRequest } from "next/server";

// Triggered by Vercel Cron. Protected by CRON_SECRET so only Vercel (or an
// authorized caller) can run it. Charges every subscription whose next_charge_at
// is due, via the shared chargeSubscription helper.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await getDueSubscriptions();
  const results = [];
  for (const sub of due) {
    const r = await chargeSubscription(sub);
    results.push({ sub: sub.merchant_subscription_id, ...r });
  }

  return Response.json({ processed: due.length, results });
}
