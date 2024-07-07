import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToWords } from "to-words";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantTransactionId = searchParams.get("txnId");
  const amountInRupees = searchParams.get("amount");
  const name = searchParams.get("name");
  const contact = searchParams.get("contact");
  const pan = searchParams.get("pan");
  const addr = searchParams.get("address");
  const modeOfPayment = searchParams.get("mode");

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

  // if user has entered their details then generate receipt
  if (
    name &&
    addr &&
    contact &&
    pan &&
    amountInWords &&
    amountInRupees &&
    modeOfPayment &&
    merchantTransactionId
  ) {
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
