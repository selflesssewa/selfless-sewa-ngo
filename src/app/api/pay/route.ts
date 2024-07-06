import SHA256 from "crypto-js/sha256";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amount = searchParams.get("amount")!;
  const name = searchParams.get("name")!;
  const addr = searchParams.get("addr")!;
  const phone = searchParams.get("phone")!;
  const pan = searchParams.get("pan")!;

  const apiUrl = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
  const merchantId = "M22GE2J7US8VN";
  const saltKey = "fe68dfe6-a825-4479-8b54-9989aec729d6";
  const saltIndex = "1";
  const merchantTransactionId = nanoid();
  const merchantUserId = "MUID123";
  const redirectUrl = `https://selflesssewango.com/payment-status?t=${merchantTransactionId}&a=${amount}`;

  // if user has entered their details then generate receipt
  if (name && addr && phone && pan) {
    const pdfPath = path.join(__dirname, '../../../../../receipt.pdf');
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
      color: rgb(0, 0, 0)
    });

    const timestamp = new Date().toLocaleString();
    page.drawText(timestamp, {
      x: 120,
      y: 455,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0)
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
      color: rgb(0, 0, 0)
    });

    page.drawText(`${pan}`, {
      x: xStart,
      y: yStart - yOffset,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });

    page.drawText(`${phone}`, {
      x: xStart,
      y: yStart - 2*yOffset,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });

    page.drawText(`${addr}`, {
      x: xStart,
      y: yStart - 3*yOffset,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });

    const modifiedPdfBytes = await pdfDoc.save();

    const outputPath = path.join(
      __dirname,
      '../../../../../receipts',
      merchantTransactionId,
      `${merchantTransactionId}_receipt.pdf`
    );
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, modifiedPdfBytes);
    console.log('PDF modified and saved successfully.');
  }

  return Response.json(null);

  const payload = {
    merchantId: merchantId,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: merchantUserId,
    amount: parseInt(amount) * 100,
    redirectUrl: redirectUrl,
    redirectMode: "REDIRECT",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const payloadJson = JSON.stringify(payload);
  const base64Payload = btoa(payloadJson);
  const checksum =
    SHA256(base64Payload + "/pg/v1/pay" + saltKey).toString() +
    "###" +
    saltIndex;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
    },
    body: JSON.stringify({
      request: base64Payload,
    }),
  };

  try {
    const response = await fetch(apiUrl, options);

    const responseData = await response.json();
    if (
      responseData.success &&
      responseData.data.instrumentResponse.redirectInfo
    ) {
      const paymentUrl = responseData.data.instrumentResponse.redirectInfo.url;
      return Response.json({ paymentUrl });
    } else {
      console.error("Payment initiation failed:", responseData.message);
      return Response.json(null);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
