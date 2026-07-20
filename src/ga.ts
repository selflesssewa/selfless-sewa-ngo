import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Pulls a founder-friendly summary from Google Analytics 4 via the Data API.
// Reads credentials from env (a Google service account with Viewer access to
// the GA4 property). Returns { configured: false } if not set up, so the admin
// UI can show a friendly "not connected yet" state instead of erroring.

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

function getClient(): BetaAnalyticsDataClient | null {
  const client_email = process.env.GA4_CLIENT_EMAIL;
  const private_key = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!PROPERTY_ID || !client_email || !private_key) return null;
  return new BetaAnalyticsDataClient({
    credentials: { client_email, private_key },
  });
}

const num = (v?: string | null) => Number(v ?? 0) || 0;

export type TAnalytics = {
  configured: boolean;
  error?: string;
  days: number;
  overview: {
    users: number;
    newUsers: number;
    sessions: number;
    pageviews: number;
    avgSessionSec: number;
  };
  last7Users: number;
  sources: Array<{ label: string; users: number }>;
  pages: Array<{ path: string; views: number }>;
  cities: Array<{ city: string; users: number }>;
  devices: Array<{ device: string; users: number }>;
  funnel: {
    donateClicks: number;
    checkouts: number;
    donations: number;
    revenue: number;
    conversionRate: number; // donations / users, %
  };
  donateByLocation: Array<{ location: string; clicks: number }>;
};

const EMPTY: Omit<TAnalytics, "configured" | "days" | "error"> = {
  overview: { users: 0, newUsers: 0, sessions: 0, pageviews: 0, avgSessionSec: 0 },
  last7Users: 0,
  sources: [],
  pages: [],
  cities: [],
  devices: [],
  funnel: { donateClicks: 0, checkouts: 0, donations: 0, revenue: 0, conversionRate: 0 },
  donateByLocation: [],
};

// Tiny in-memory cache so repeated admin refreshes don't burn GA4 API quota.
let cache: { key: string; at: number; data: TAnalytics } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function getAnalytics(days = 30): Promise<TAnalytics> {
  const key = `d${days}`;
  if (cache && cache.key === key && Date.now() - cache.at < TTL_MS) {
    return cache.data;
  }

  const client = getClient();
  if (!client) return { configured: false, days, ...EMPTY };

  const property = `properties/${PROPERTY_ID}`;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  const run = (req: Parameters<typeof client.runReport>[0]) =>
    client.runReport(req).then(([r]) => r);
  const rows = (r: Awaited<ReturnType<typeof run>>) => r?.rows ?? [];
  const cell = (r: Awaited<ReturnType<typeof run>>, m = 0) =>
    num(r?.rows?.[0]?.metricValues?.[m]?.value);

  try {
    const [ov, seven, src, pg, cty, dev, evt, loc, rev] = await Promise.all([
      run({
        property,
        dateRanges,
        metrics: [
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
        ],
      }),
      run({
        property,
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      }),
      run({
        property,
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      run({
        property,
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
      run({
        property,
        dateRanges,
        dimensions: [{ name: "city" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      run({
        property,
        dateRanges,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
      run({
        property,
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: ["donate_cta_click", "begin_checkout", "purchase"],
            },
          },
        },
      }),
      run({
        property,
        dateRanges,
        dimensions: [{ name: "customEvent:location" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: { value: "donate_cta_click" },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 10,
      }),
      run({ property, dateRanges, metrics: [{ name: "totalRevenue" }] }),
    ]);

    const evtCount: Record<string, number> = {};
    rows(evt).forEach((r) => {
      evtCount[r.dimensionValues?.[0]?.value ?? ""] = num(
        r.metricValues?.[0]?.value,
      );
    });

    const users = cell(ov, 0);
    const donations = evtCount["purchase"] ?? 0;

    const data: TAnalytics = {
      configured: true,
      days,
      overview: {
        users,
        newUsers: cell(ov, 1),
        sessions: cell(ov, 2),
        pageviews: cell(ov, 3),
        avgSessionSec: cell(ov, 4),
      },
      last7Users: cell(seven, 0),
      sources: rows(src).map((r) => ({
        label: r.dimensionValues?.[0]?.value || "(unknown)",
        users: num(r.metricValues?.[0]?.value),
      })),
      pages: rows(pg).map((r) => ({
        path: r.dimensionValues?.[0]?.value || "/",
        views: num(r.metricValues?.[0]?.value),
      })),
      cities: rows(cty).map((r) => ({
        city: r.dimensionValues?.[0]?.value || "(not set)",
        users: num(r.metricValues?.[0]?.value),
      })),
      devices: rows(dev).map((r) => ({
        device: r.dimensionValues?.[0]?.value || "(unknown)",
        users: num(r.metricValues?.[0]?.value),
      })),
      funnel: {
        donateClicks: evtCount["donate_cta_click"] ?? 0,
        checkouts: evtCount["begin_checkout"] ?? 0,
        donations,
        revenue: cell(rev, 0),
        conversionRate: users > 0 ? (donations / users) * 100 : 0,
      },
      donateByLocation: rows(loc).map((r) => ({
        location: r.dimensionValues?.[0]?.value || "(not set)",
        clicks: num(r.metricValues?.[0]?.value),
      })),
    };

    cache = { key, at: Date.now(), data };
    return data;
  } catch (e) {
    return {
      configured: true,
      days,
      error: e instanceof Error ? e.message : String(e),
      ...EMPTY,
    };
  }
}
