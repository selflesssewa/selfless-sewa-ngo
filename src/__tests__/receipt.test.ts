// Unit tests for PDF generation + WinAnsi sanitization.
// No DB/network — these always run.
import { describe, it, expect } from "vitest";
import {
  generateAcknowledgmentPdf,
  generateReceiptPdf,
  winAnsiSafe,
} from "../receipt";

const isPdf = (bytes: Uint8Array) =>
  bytes.length > 100 &&
  String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "%PDF";

describe("winAnsiSafe", () => {
  it("keeps plain ASCII unchanged", () => {
    expect(winAnsiSafe("Asha Verma 123")).toBe("Asha Verma 123");
  });

  it("keeps Latin-1 accented letters", () => {
    expect(winAnsiSafe("José Sörén")).toBe("José Sörén");
  });

  it("replaces Devanagari / non-encodable scripts with '?'", () => {
    const out = winAnsiSafe("अशा वर्मा");
    // every non-Latin char becomes '?'; spaces preserved; no Devanagari left
    expect(out).toMatch(/^[? ]+$/);
    expect(out).not.toMatch(/[ऀ-ॿ]/);
  });

  it("replaces emoji with '?'", () => {
    expect(winAnsiSafe("Hi 😀")).toBe("Hi ?");
  });

  it("handles null/undefined", () => {
    expect(winAnsiSafe(null)).toBe("");
    expect(winAnsiSafe(undefined)).toBe("");
  });
});

describe("generateReceiptPdf", () => {
  const base = {
    txnId: "TXN123",
    name: "Asha Verma",
    pan: "ABCDE1234F",
    contact: "9876543210",
    address: "12 MG Road, Pune",
    paymentMode: "UPI",
    amountInRupees: "1100",
  };

  it("produces a valid PDF", async () => {
    const pdf = await generateReceiptPdf(base);
    expect(isPdf(pdf)).toBe(true);
  });

  it("does NOT throw on a Devanagari name + address (real-world break)", async () => {
    const pdf = await generateReceiptPdf({
      ...base,
      name: "अशा वर्मा",
      address: "१२ एमजी रोड, पुणे",
    });
    expect(isPdf(pdf)).toBe(true);
  });
});

describe("generateAcknowledgmentPdf", () => {
  const base = {
    txnId: "TXN999",
    name: "Ravi Kumar",
    contact: "9000000000",
    paymentMode: "CARD",
    amountInRupees: "500",
  };

  it("produces a valid PDF", async () => {
    const pdf = await generateAcknowledgmentPdf(base);
    expect(isPdf(pdf)).toBe(true);
  });

  it("does NOT throw on unicode name", async () => {
    const pdf = await generateAcknowledgmentPdf({ ...base, name: "रवि कुमार 😀" });
    expect(isPdf(pdf)).toBe(true);
  });

  it("handles a missing/zero amount without throwing", async () => {
    const pdf = await generateAcknowledgmentPdf({ ...base, amountInRupees: "0" });
    expect(isPdf(pdf)).toBe(true);
  });
});
