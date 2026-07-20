import { sendGAEvent } from "@next/third-parties/google";

// Fire a GA4 event. Safe to call anywhere client-side: a no-op if GA isn't
// loaded (e.g. dev without NEXT_PUBLIC_GA_ID), and never throws — analytics
// must never break the app.
export function track(event: string, params: Record<string, unknown> = {}) {
  try {
    sendGAEvent("event", event, params);
  } catch {
    /* ignore */
  }
}
