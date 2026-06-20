import type { NextRequest } from "next/server";

// Minimal gate for the owner-only admin endpoints. Accepts the key via either
// `Authorization: Bearer <key>` or a `?key=` query param (so a plain <a>
// download link works). Requires ADMIN_KEY to be set.
export function isAdmin(request: NextRequest): boolean {
  const key = process.env.ADMIN_KEY;
  if (!key) return false;
  const header = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const provided = header || request.nextUrl.searchParams.get("key") || "";
  return provided.length > 0 && provided === key;
}
