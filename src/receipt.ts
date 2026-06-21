import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToWords } from "to-words";

// pdf-lib's StandardFonts use WinAnsi (Latin-1) encoding and THROW on any
// character they can't encode (e.g. Devanagari/regional scripts, emoji). Indian
// donors routinely enter names/addresses in such scripts, so we replace every
// non-encodable character with "?" — the PDF still generates instead of crashing.
export function winAnsiSafe(s: string | null | undefined): string {
  return Array.from(s ?? "", (ch) => {
    const c = ch.codePointAt(0) ?? 0;
    return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) ? ch : "?";
  }).join("");
}

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
      symbol: "Rs.",
      fractionalUnit: { name: "Paisa", plural: "Paise", symbol: "" },
    },
  },
});

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
  const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer));
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

  page.drawText(winAnsiSafe(name), {
    x: xStart,
    y: yStart,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(winAnsiSafe(pan), {
    x: xStart,
    y: yStart - yOffset,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(winAnsiSafe(contact), {
    x: xStart,
    y: yStart - 2 * yOffset,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(winAnsiSafe(address), {
    x: xStart,
    y: yStart - 3 * yOffset,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(winAnsiSafe(paymentMode), {
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

export type TAcknowledgmentData = {
  txnId: string;
  name: string;
  contact: string;
  paymentMode: string;
  amountInRupees: string;
};

// A simple one-page acknowledgment for non-receipt donations (no PAN/address,
// so it is NOT an 80G receipt). Built from scratch — no template file.
export async function generateAcknowledgmentPdf(
  data: TAcknowledgmentData,
): Promise<Uint8Array> {
  const { txnId, name, contact, paymentMode, amountInRupees } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 420]); // A5-ish, portrait-ish
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const grey = rgb(0.35, 0.35, 0.35);

  page.drawText("Selfless Sewa NGO", {
    x: 40,
    y: 360,
    size: 22,
    font: bold,
    color: black,
  });
  page.drawText("Donation Acknowledgment", {
    x: 40,
    y: 335,
    size: 13,
    font,
    color: grey,
  });
  page.drawLine({
    start: { x: 40, y: 320 },
    end: { x: 555, y: 320 },
    thickness: 1,
    color: grey,
  });

  const rows: Array<[string, string]> = [
    ["Date", new Date().toLocaleString("en-IN")],
    ["Transaction ID", txnId],
    ["Name", name],
    ["Phone", contact],
    ["Payment mode", paymentMode || "-"],
    ["Amount", `Rs. ${amountInRupees}`],
    ["In words", toWords.convert(Number(amountInRupees))],
  ];

  let y = 290;
  for (const [label, value] of rows) {
    page.drawText(`${label}:`, { x: 40, y, size: 11, font: bold, color: grey });
    page.drawText(winAnsiSafe(value), {
      x: 160,
      y,
      size: 11,
      font,
      color: black,
      maxWidth: 395,
      lineHeight: 14,
    });
    y -= 26;
  }

  page.drawText(
    "Thank you for your generous contribution to Selfless Sewa NGO.",
    { x: 40, y: y - 6, size: 11, font, color: grey, maxWidth: 515 },
  );

  return pdfDoc.save();
}
