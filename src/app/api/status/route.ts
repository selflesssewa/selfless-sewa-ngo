import { callStatusApi } from "@/phonepe";
import { finalizeDonation } from "@/db";
import { archiveDonation } from "@/archive";
import { decodeJwt } from "jose";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const token = searchParams.get("t");

  if (!token) return Response.json(null, { status: 401 });
  let payload = null;
  try {
    payload = await decodeJwt(token);
  } catch (e) {
    console.error("Token Error", e);
    if (!token) return Response.json(null, { status: 401 });
  }

  try {
    const { data } = await callStatusApi(payload.id);

    // Finalize the ledger row as soon as PhonePe reports a terminal state.
    // Idempotent (only updates PENDING rows); never break the status response.
    const state: string | undefined = data?.data?.state;
    if (state === "COMPLETED" || state === "FAILED") {
      try {
        await finalizeDonation(
          payload.id as string,
          state,
          data?.data?.paymentInstrument?.type ?? null,
        );
      } catch (e) {
        console.error("Ledger finalize failed (non-fatal):", e);
      }

      // On success, kick off the Drive archive in the background so the owner's
      // copy lands within seconds. Fire-and-forget: never block or break the
      // donor's poll response. /api/cron/archive remains the fallback for any
      // that don't finish (closed tab, transient Drive error). Idempotent.
      if (state === "COMPLETED") {
        archiveDonation(payload.id as string).catch((e) =>
          console.error("Archive failed in status route (non-fatal):", e),
        );
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error:", error);
  }
  return Response.json(null);
}
