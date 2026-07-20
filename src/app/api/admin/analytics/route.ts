import { isAdmin } from "@/admin";
import { getAnalytics } from "@/ga";
import { NextRequest } from "next/server";

// GA4 reports can be slowish; give it headroom.
export const maxDuration = 30;

// Owner-only: a founder-friendly Google Analytics summary for the admin panel.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const daysRaw = Number(request.nextUrl.searchParams.get("days"));
  const days = [7, 30, 90].includes(daysRaw) ? daysRaw : 30;
  const data = await getAnalytics(days);
  return Response.json(data);
}
