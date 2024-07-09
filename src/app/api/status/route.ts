import { callStatusApi } from "@/helper";
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
    return Response.json(data);
  } catch (error) {
    console.error("Error:", error);
  }
  return Response.json(null);
}
