import { callStatusApi, getEnvVariable } from "@/helper";
import { readFile } from "fs/promises";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToWords } from "to-words";

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
    const modifiedPdfBytes = await generatePdf(
      merchantTransactionId,
      name,
      pan,
      contact,
      addr,
      modeOfPayment,
      amountInRupees,
    );

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

async function generatePdf(
  merchantTransactionId: string,
  name: string,
  pan: string,
  contact: string,
  addr: string,
  modeOfPayment: string,
  amountInRupees: string,
) {
  const toWords = new ToWords({
    localeCode: "en-IN",
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
      currencyOptions: {
        name: "Rupee",
        plural: "Rupees",
        symbol: "₹",
        fractionalUnit: {
          name: "Paisa",
          plural: "Paise",
          symbol: "",
        },
      },
    },
  });

  const amountInWords = toWords.convert(Number(amountInRupees));

  const pdfPath = path.join(process.cwd(), "receipt.pdf");
  console.log(pdfPath);
  const pdfBuffer = await readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const page = pdfDoc.getPages()[0];
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 16;

  const last4Chars = merchantTransactionId.slice(-4);
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();

  const receiptNo = `${month}/${last4Chars}/${date}`;

  page.drawText(receiptNo, {
    x: 230,
    y: 487,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  const timestamp = new Date().toLocaleString();
  page.drawText(timestamp, {
    x: 120,
    y: 455,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  // Add text to the PDF in the middle of the page
  const xStart = 150;
  const yStart = 383;
  const yOffset = 25;

  page.drawText(`${name}`, {
    x: xStart,
    y: yStart,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`${pan}`, {
    x: xStart,
    y: yStart - yOffset,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`${contact}`, {
    x: xStart,
    y: yStart - 2 * yOffset,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`${addr}`, {
    x: xStart,
    y: yStart - 3 * yOffset,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(modeOfPayment, {
    x: 40,
    y: yStart - 6.6 * yOffset,
    size: 20,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Rs. ${amountInRupees}`, {
    x: 280,
    y: yStart - 6.6 * yOffset,
    size: 20,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(amountInWords, {
    x: 470,
    y: yStart - 6.6 * yOffset,
    size: 14,
    lineHeight: 20,
    maxWidth: 300,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}
