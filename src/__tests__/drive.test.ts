// Unit tests for the Drive upload helper. Mocks fetch — no real network.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadPdfToDrive } from "../drive";

vi.stubEnv("GOOGLE_APPS_SCRIPT_URL", "https://script.test/exec");
vi.stubEnv("GOOGLE_APPS_SCRIPT_SECRET", "test-secret");

const pdf = new Uint8Array([1, 2, 3, 4]);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("uploadPdfToDrive", () => {
  it("posts the base64 PDF + secret and returns fileId/link", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, fileId: "F1", link: "https://drive/F1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await uploadPdfToDrive(pdf, "receipt_x.pdf");
    expect(res).toEqual({ fileId: "F1", link: "https://drive/F1" });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://script.test/exec");
    const body = JSON.parse(opts.body);
    expect(body.secret).toBe("test-secret");
    expect(body.filename).toBe("receipt_x.pdf");
    expect(body.pdfBase64).toBe(Buffer.from(pdf).toString("base64"));
  });

  it("throws when the script reports ok:false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: false, error: "unauthorized" }),
      }),
    );
    await expect(uploadPdfToDrive(pdf, "x.pdf")).rejects.toThrow("unauthorized");
  });

  it("throws on a non-2xx HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    await expect(uploadPdfToDrive(pdf, "x.pdf")).rejects.toThrow("HTTP 500");
  });

  it("propagates network/abort errors (so the row stays unarchived)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("The operation was aborted")),
    );
    await expect(uploadPdfToDrive(pdf, "x.pdf")).rejects.toThrow("aborted");
  });
});
