import { getUnarchivedDonations } from "@/db";
import { archiveDonation } from "@/archive";
import { NextRequest } from "next/server";

// Vercel Cron. Retries archiving COMPLETED donations whose Drive upload hasn't
// succeeded yet (closed-tab finalizations, transient Drive errors). Protected
// by CRON_SECRET. archiveDonation is idempotent and never throws.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await getUnarchivedDonations(50);
  for (const d of pending) {
    await archiveDonation(d.txn_id);
  }

  return Response.json({ attempted: pending.length });
}
