import { getEnvVariable } from "./helper";

export type TDriveUploadResult = { fileId: string; link: string };

// Uploads a PDF to the NGO's Google Drive via the Apps Script Web App
// (deployed under selflesssewango@gmail.com). The script files it under
// Receipts/<year>/<month>/ and returns the file id + view link.
export async function uploadPdfToDrive(
  pdf: Uint8Array,
  filename: string,
  timeoutMs = 25_000,
): Promise<TDriveUploadResult> {
  const url = getEnvVariable("GOOGLE_APPS_SCRIPT_URL");
  const secret = getEnvVariable("GOOGLE_APPS_SCRIPT_SECRET");

  // Bound the request so a slow/hung Apps Script can't stall the cron.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        filename,
        pdfBase64: Buffer.from(pdf).toString("base64"),
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`Drive upload HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    ok: boolean;
    fileId?: string;
    link?: string;
    error?: string;
  };
  if (!data.ok || !data.fileId || !data.link) {
    throw new Error(data.error || "Drive upload failed");
  }
  return { fileId: data.fileId, link: data.link };
}
