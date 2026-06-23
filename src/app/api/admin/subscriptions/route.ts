import { isAdmin } from "@/admin";
import { listSubscriptions } from "@/db";
import { NextRequest } from "next/server";

// Owner-only: recurring mandates (subscriptions) with their charge summaries.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscriptions = await listSubscriptions(2000);
  return Response.json({ subscriptions });
}
