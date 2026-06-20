import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToWords } from "to-words";

export type TReceiptData = {
  txnId: string;
  name: string;
  pan: string;
  contact: string;
  address: string;
  paymentMode: string;
  amountInRupees: string;
};

// Fills the receipt.pdf template from a single donation's data. Stateless —
// callable from the live download route and the admin re-download route alike.
export async function generateReceiptPdf(data: TReceiptData): Promise<Uint8Array> {
  const { txnId, name, pan, contact, address, paymentMode, amountInRupees } =
    data;

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
  const pdfBuffer = await readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const page = pdfDoc.getPages()[0];
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 16;

  const last4Chars = txnId.slice(-4);
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

  page.drawText(`${address}`, {
    x: xStart,
    y: yStart - 3 * yOffset,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(paymentMode, {
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

  return pdfDoc.save();
}
