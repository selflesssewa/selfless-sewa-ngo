import { readFile } from "fs/promises";
import { NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(request: NextRequest, response: NextApiResponse) {
  // const searchParams = request.nextUrl.searchParams;
  // const amount = searchParams.get("amount")!;
  // const name = searchParams.get("name")!;
  // const addr = searchParams.get("addr")!;
  // const phone = searchParams.get("phone")!;
  // const pan = searchParams.get("pan")!;

  const merchantTransactionId = "adsadad";
  const pan = "dadsxzczc";
  const addr = "czxcdvjlj";
  const phone = "46546546";
  const name = "john";

  // if user has entered their details then generate receipt
  if (name && addr && phone && pan) {
    console.log(__dirname);
    const pdfPath = path.join(__dirname, "../../../../../receipt.pdf");
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

    const textToDraw = `${month}/${last4Chars}/${date}`;

    page.drawText(textToDraw, {
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

    page.drawText(`${phone}`, {
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

    const modifiedPdfBytes = await pdfDoc.save();

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");

    const blob = new Blob([modifiedPdfBytes]);
    return new NextResponse(blob, {
      status: 200,
      statusText: "OK",
      headers,
    });
  }

  return Response.json(null);
}
