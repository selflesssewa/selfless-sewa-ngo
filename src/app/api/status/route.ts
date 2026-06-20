import { callStatusApi } from "@/helper";
import { finalizeDonation } from "@/db";
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
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error:", error);
  }
  return Response.json(null);
}
