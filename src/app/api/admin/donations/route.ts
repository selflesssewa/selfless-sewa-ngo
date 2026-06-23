import { isAdmin } from "@/admin";
import { listDonations } from "@/db";
import { NextRequest } from "next/server";

// Owner-only: the full donor ledger (one-time donations).
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const donations = await listDonations(2000);
  return Response.json({ donations });
}
