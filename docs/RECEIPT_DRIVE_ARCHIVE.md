# Receipt Archiving to Google Drive — Design

**Status:** ✅ Implemented & verified end-to-end (June 2026). The Apps Script is
deployed under `selflesssewango@gmail.com` and both receipt and acknowledgment
PDFs were confirmed uploading to Drive with the link saved on the row.
**Goal:** in addition to the on-demand receipts (#9A), automatically save a **PDF
copy of every completed donation** into a dedicated folder in
`selflesssewango@gmail.com`'s Google Drive, so the owner can browse/back up/share
them as files.

**Scope: both receipt and non-receipt donations.**
- **Receipt donors** → the formal 80G **receipt** PDF (has PAN + address).
- **Non-receipt donors** → a lightweight **acknowledgment** PDF (name, phone,
  amount, date, txn id, mode). A formal receipt is impossible without PAN/address,
  so this is a "record of donation," not a tax receipt.

Both land in the same folder, distinguished by filename (`receipt_…` vs `ack_…`).

This is **additive**: the Neon database stays the source of truth, the `/admin`
ledger and on-demand download still work. Drive is just a file backup of the
receipt PDFs.

---

## Why Apps Script (recap)

`selflesssewango@gmail.com` is **plain Gmail + Google One (100 GB)** — a consumer
account, not Workspace. That rules out the Service-Account + Shared-Drive
approach (no personal storage quota / no Shared Drives). So we use a **Google
Apps Script Web App bound to that account**: it runs *as the owner*, writes to
the owner's Drive (files owned by the owner, owner's quota), and we just POST the
PDF to a secret URL. No OAuth tokens, no service-account keys.

---

## How the admin and Drive fit together

| | Admin `/admin` | Drive archive |
|---|---|---|
| Shows | **all** donations (incl. anonymous), filters, totals, CSV | only receipt **PDF files** |
| Purpose | live operational ledger | browsable file backup |
| Source | Neon DB | a Drive folder |

→ The admin stays the main tool. Once a receipt is archived, the admin row shows
an **"Open in Drive"** link. They reinforce each other.

---

## Architecture / flow

```
/api/cron/archive  (out-of-band; NOT in the donor's request path)
   │  scans COMPLETED donations with drive_file_id IS NULL
   ▼
App generates the PDF:
   • wants_receipt (+ PAN & address) → formal receipt (src/receipt.ts)
   • otherwise                       → acknowledgment (generateAcknowledgmentPdf)
   │
   ▼
POST { secret, filename, pdfBase64 }  →  Apps Script Web App  (runs as owner)
   │                                         • verifies secret
   │                                         • saves PDF into Receipts/<year>/<month>/
   │                                         • returns { fileId, link }
   ▼
App stores drive_file_id + drive_file_link on the donations row
```

- **Off the donor path (important):** archiving runs **only** in
  `/api/cron/archive`, never inside the payment-status poll — so a slow/down
  Drive can't delay or break the donor's confirmation (which runs under a ~10s
  serverless limit). The upload itself has a 25s timeout.
- **Idempotent:** only archive when `drive_file_id IS NULL`.
- **Retries automatically:** a failure leaves `drive_file_id` null and records
  `archive_error`, so the next cron run re-attempts.
- **Unicode-safe:** donor names/addresses in Devanagari/regional scripts are
  sanitized (`winAnsiSafe`) so pdf-lib never crashes generating the PDF.

---

## Part 1 — Owner setup (one-time, in `selflesssewango@gmail.com`)

### 1. Create the dedicated folder
- In Drive (logged in as `selflesssewango@gmail.com`), create a folder, e.g.
  **"Selfless Sewa Receipts"**. Keep it **private** (do NOT share "anyone with
  the link" — receipts contain PAN/address).
- Open the folder; copy its **ID** from the URL:
  `https://drive.google.com/drive/folders/<THIS_IS_THE_ID>`.

### 2. Create the Apps Script
- Go to <https://script.google.com> → **New project** (while logged in as
  `selflesssewango@gmail.com`).
- Paste this, filling in the secret and folder ID:

```javascript
// Selfless Sewa — receipt archiver. Bound to selflesssewango@gmail.com.
const SECRET = 'PUT-A-LONG-RANDOM-SECRET';        // must equal GOOGLE_APPS_SCRIPT_SECRET in the app
const ROOT_FOLDER_ID = 'PUT-THE-RECEIPTS-FOLDER-ID';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json({ ok: false, error: 'unauthorized' });

    const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const now = new Date();
    const y = String(now.getFullYear());
    const m = ('0' + (now.getMonth() + 1)).slice(-2);
    const folder = child(child(root, y), m);          // Receipts/2026/06/

    const bytes = Utilities.base64Decode(body.pdfBase64);
    const blob = Utilities.newBlob(bytes, 'application/pdf', body.filename || 'receipt.pdf');
    const file = folder.createFile(blob);

    return json({ ok: true, fileId: file.getId(), link: file.getUrl() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function child(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. Deploy as a Web App
- **Deploy → New deployment → Web app**.
- **Execute as: Me** (`selflesssewango@gmail.com`) — this is what makes files land
  in this account's Drive.
- **Who has access: Anyone** — required so our server can POST without a Google
  login. (Safe: the `SECRET` gates real use, and the files themselves are private.)
- Authorize the script when prompted (it needs Drive access).
- Copy the **Web app URL** (ends in `/exec`).

> If you ever change the script, use **Manage deployments → edit → New version**,
> or the URL won't pick up changes.

---

## Part 2 — App side (implemented)

> Built in `src/drive.ts` (upload), `src/archive.ts` (`archiveDonation`),
> `generateAcknowledgmentPdf` in `src/receipt.ts`, the archive hook in the status
> route + reconcile cron, the `/api/cron/archive` retry sweep, and the admin
> "Drive" link. Details below.

### Environment variables
| Variable | Value |
|----------|-------|
| `GOOGLE_APPS_SCRIPT_URL` | the `/exec` Web app URL |
| `GOOGLE_APPS_SCRIPT_SECRET` | the same secret as in the script |

### DB columns (migration)
```sql
ALTER TABLE donations ADD COLUMN IF NOT EXISTS drive_file_id   text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS drive_file_link text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS archive_error   text;
```

### New helper (sketch, `src/drive.ts`)
```ts
export async function archiveReceiptToDrive(pdf: Uint8Array, filename: string) {
  const res = await fetch(getEnvVariable("GOOGLE_APPS_SCRIPT_URL"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: getEnvVariable("GOOGLE_APPS_SCRIPT_SECRET"),
      filename,
      pdfBase64: Buffer.from(pdf).toString("base64"),
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "drive upload failed");
  return { fileId: data.fileId as string, link: data.link as string };
}
```

### Where it hooks in
- After a donation is finalized COMPLETED **and** `drive_file_id IS NULL`:
  generate the right PDF (`generateReceiptPdf` if `wants_receipt`, else
  `generateAcknowledgmentPdf`), call `archiveReceiptToDrive`, then
  `UPDATE donations SET drive_file_id=…, drive_file_link=…`. Wrap in try/catch →
  on failure store `archive_error` and leave `drive_file_id` null for the retry.
- **Retry cron** (`/api/cron/archive`): find COMPLETED donations with
  `drive_file_id IS NULL`, retry, update.
- **Admin:** add a "Drive" column linking to `drive_file_link` when present.

### A second, simple PDF (`generateAcknowledgmentPdf`)
Non-receipt donations have no PAN/address, so we can't use the 80G template.
`generateAcknowledgmentPdf` builds a plain one-page PDF with pdf-lib (no template
file): NGO name/header, donor name + phone, amount (figures + words), date,
transaction id, payment mode. Clearly an acknowledgment, not a tax receipt.

### Filenames
- Receipt donations: `receipt_<YYYY-MM-DD>_<name>_<txnId>.pdf`
- Non-receipt donations: `ack_<YYYY-MM-DD>_<name>_<txnId>.pdf`

---

## Security / PII
- Folder stays **private** to `selflesssewango@gmail.com`. Never "anyone with the
  link" — receipts contain **PAN + address**.
- `GOOGLE_APPS_SCRIPT_SECRET` lives only in env (never client-side); the script
  rejects requests without it.
- The Drive files are private; `drive_file_link` opens only for someone logged in
  to the account. We store the link for convenience, not public access.

---

## Decisions (settled)
1. **Folder organization** — ✅ `Receipts/<year>/<month>/` (browsable as volume grows).
2. **Archive scope** — ✅ **both**: receipt donors get the formal receipt PDF,
   non-receipt donors get an acknowledgment PDF (`ack_…`).

## Open / future
3. **Recurring (#9B)** — the `redemptions` table already has `drive_file_id`/
   `drive_file_link`; the same `archiveReceiptToDrive` helper will serve per-cycle
   receipts once autopay is live.
```
