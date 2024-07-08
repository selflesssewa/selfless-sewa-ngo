import axios from "axios";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToWords } from "to-words";
import { readFile } from "fs/promises";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantTxnId = searchParams.get("txnId");
  const name = searchParams.get("name");
  const contact = searchParams.get("contact");
  const pan = searchParams.get("pan");
  const addr = searchParams.get("address");

  const merchantId = "M22GE2J7US8VN";
  const saltKey = "fe68dfe6-a825-4479-8b54-9989aec729d6";
  const saltIndex = "1";
  const apiUrl = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTxnId}`;
  
  const checksum =
    crypto
      .createHash("sha256")
      .update(`/pg/v1/status/${merchantId}/${merchantTxnId}` + saltKey)
      .digest("hex") +
    "###" +
    saltIndex;

  const config = {
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId,
    },
  };

  try {
    const response = await axios.get(apiUrl, config);
    const data = response.data;
    const paymentState = data?.data?.state;
    const amountInRupees = (data?.data?.amount / 100).toString();
    const modeOfPayment = data?.data?.type;
    if (paymentState === "COMPLETED") {
      const blob = generatePdf(name, merchantTxnId, contact, addr, pan, amountInRupees, modeOfPayment);
      return Response.json({ data, blob: blob});
    }
    return Response.json({ data, blob: null });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function generatePdf(name: string | null, merchantTxnId: string | any[] | null, contact: string | null, addr: string | null, pan: string | null, amountInRupees: string | null, modeOfPayment: string | null) {
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
    merchantTxnId
  ) {
    const pdfPath = path.join(process.cwd(), "receipt.pdf");
    console.log(pdfPath);
    const pdfBuffer = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const page = pdfDoc.getPages()[0];
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 16;

    const last4Chars = merchantTxnId.slice(-4);
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

    const blob = new Blob([modifiedPdfBytes]);
    return blob;
  }
}