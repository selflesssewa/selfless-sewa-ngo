import { callStatusApi, getEnvVariable } from "@/helper";
import { generateReceiptPdf } from "@/receipt";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(getEnvVariable("JWT_SECRET"));

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const token = searchParams.get("t");
  if (!token) return Response.json(null, { status: 401 });

  let data = null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    data = payload;
  } catch (e) {
    console.error("Token Error", e);
    return Response.json(null, { status: 401 });
  }

  console.log({ data });
  const merchantTransactionId = data.id as string;
  const amountInRupees = data.a as string;
  const name = data.n as string;
  const contact = data.c as string;
  const pan = data.p as string;
  const addr = data.ad as string;
  let modeOfPayment: string | undefined;

  try {
    const { data: statusData } = await callStatusApi(merchantTransactionId);
    const paymentStatus = statusData?.data?.state;
    if (paymentStatus !== "COMPLETED")
      throw new Error(
        `Payment not complete for txnId: ${merchantTransactionId}`,
      );
    modeOfPayment = statusData?.data?.paymentInstrument?.type;
  } catch (e) {
    console.error("Status Check Error", e);
    return Response.json(null, { status: 400 });
  }

  // if user has entered their details then generate receipt
  if (
    name &&
    addr &&
    contact &&
    pan &&
    amountInRupees &&
    modeOfPayment &&
    merchantTransactionId
  ) {
    const modifiedPdfBytes = await generateReceiptPdf({
      txnId: merchantTransactionId,
      name,
      pan,
      contact,
      address: addr,
      paymentMode: modeOfPayment,
      amountInRupees,
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");

    const blob = new Blob([modifiedPdfBytes]);
    return new NextResponse(blob, {
      status: 200,
      statusText: "OK",
      headers,
    });
  }

  return Response.json(null, { status: 400 });
}
