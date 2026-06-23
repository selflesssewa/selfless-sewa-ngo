import { getUnarchivedRedemptions } from "@/db";
import { archiveRedemption } from "@/archive";
import { NextRequest } from "next/server";

// Vercel Cron. Retries archiving SUCCESS redemptions whose receipt Drive upload
// hasn't landed yet (transient Drive errors during the webhook's background
// archive). Protected by CRON_SECRET. archiveRedemption is idempotent and never throws.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await getUnarchivedRedemptions(50);
  for (const r of pending) {
    await archiveRedemption(r.id, r.merchant_order_id);
  }

  return Response.json({ attempted: pending.length });
}
