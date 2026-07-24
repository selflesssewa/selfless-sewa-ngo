"use client";

import { useEffect, useState } from "react";

type TAnalytics = {
  configured: boolean;
  error?: string;
  days: number;
  propertyId: string | null;
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
    conversionRate: number;
  };
  donateByLocation: Array<{ location: string; clicks: number }>;
};

// Friendly names for where a Donate button was clicked.
const LOCATION_LABELS: Record<string, string> = {
  nav: "Top navigation button",
  hero: "Homepage — main banner",
  home_campaign: "Homepage — featured campaign",
  home_cta: "Homepage — bottom card",
  campaigns_cta: "Campaigns page — bottom card",
  campaign_page: "Inside a campaign",
  projects_cta: "Projects page — bottom card",
  project_page: "Inside a project",
};

const nf = (n: number) => n.toLocaleString("en-IN");
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const mmss = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
};

// A bar fill that grows from 0 on mount / when its value changes.
function Bar({
  pct,
  className,
}: {
  pct: number;
  className: string;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <div
      className={className}
      style={{ width: `${w}%`, transition: "width 700ms cubic-bezier(0.22,1,0.36,1)" }}
    />
  );
}

// A ranked list of labelled magnitude bars (single hue = brand green).
function BarList({
  items,
  unit,
  empty,
}: {
  items: Array<{ label: string; value: number }>;
  unit?: string;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="py-3 text-body-sm text-white-70">{empty}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div className="flex flex-col gap-3">
      {items.map((i, idx) => (
        <div key={idx} title={`${i.label}: ${nf(i.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-body-sm">
            <span className="truncate">{i.label}</span>
            <span className="shrink-0 tabular-nums text-white-70">
              {nf(i.value)}
              {unit ? ` ${unit}` : ""} ·{" "}
              {Math.round((i.value / total) * 100)}%
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-blue-30">
            <Bar pct={(i.value / max) * 100} className="h-full rounded-full bg-green" />
          </div>
        </div>
      ))}
    </div>
  );
}

const card = "rounded-[0.9rem] border border-white-10 bg-blue-30 p-4";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="text-title-md font-medium">{title}</h3>
      <p className="mb-4 mt-1 text-body-sm text-white-70">{hint}</p>
      {children}
    </section>
  );
}

export default function AnalyticsPanel({ adminKey }: { adminKey: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`, {
      headers: { Authorization: `Bearer ${adminKey}` },
    })
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days, adminKey]);

  const gaLink = data?.propertyId
    ? `https://analytics.google.com/analytics/web/#/p${data.propertyId}/reports/intelligenthome`
    : "https://analytics.google.com/";

  if (loading && !data) {
    return <p className="mt-6 animate-pulse text-white-70">Loading traffic…</p>;
  }

  if (data && !data.configured) {
    return (
      <div className="mt-6 rounded-[0.9rem] border border-muskaraahat/40 bg-muskaraahat/10 p-4 text-body-sm">
        <p className="font-medium">Analytics isn&apos;t connected yet.</p>
        <p className="mt-1 text-white-70">
          Traffic tracking is live on the website, but this panel needs a Google
          service account to read it. Once that&apos;s set up, all your visitor
          and donation numbers show up here automatically.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="mt-6 text-white-70">Could not load analytics right now.</p>
    );
  }

  const { overview: o, funnel: f } = data;

  // Funnel steps (top = all visitors), each scaled against the widest (visitors).
  const funnelSteps = [
    { label: "Visited the site", value: o.users, icon: "👀" },
    { label: "Clicked a Donate button", value: f.donateClicks, icon: "🫰" },
    { label: "Started the payment", value: f.checkouts, icon: "💳" },
    { label: "Completed a donation", value: f.donations, icon: "🎉" },
  ];
  const funnelMax = Math.max(o.users, 1);

  const totalDevices = data.devices.reduce((s, d) => s + d.users, 0) || 1;
  const deviceColor: Record<string, string> = {
    mobile: "bg-green",
    desktop: "bg-saksham",
    tablet: "bg-aahar",
  };

  const overviewTiles = [
    { icon: "👥", label: "Visitors", value: nf(o.users), sub: `${nf(data.last7Users)} in the last 7 days` },
    { icon: "✨", label: "New visitors", value: nf(o.newUsers), sub: "first time on the site" },
    { icon: "🔁", label: "Visits", value: nf(o.sessions), sub: "total sessions" },
    { icon: "📄", label: "Pages viewed", value: nf(o.pageviews), sub: "pages opened" },
    { icon: "⏱️", label: "Avg. time", value: mmss(o.avgSessionSec), sub: "spent per visit" },
  ];

  return (
    <div>
      {/* Controls: date range + open-in-GA */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-white-70">Last</span>
          <div className="flex gap-1 rounded-[0.7rem] bg-blue-30 p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-[0.5rem] px-3 py-1 text-body-sm font-medium transition-colors ${
                  days === d ? "bg-green text-black" : "text-white-70"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
        <a
          href={gaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-[0.7rem] border border-white-30 px-3 py-2 text-body-sm font-medium transition-colors hover:bg-blue-30"
        >
          Open Google Analytics
          <span aria-hidden>↗</span>
        </a>
      </div>

      {data.error && (
        <p className="mt-3 rounded-[0.6rem] border border-chikitsa/40 bg-chikitsa/10 p-2 text-body-sm">
          Google returned an error: {data.error}
        </p>
      )}

      {/* AT A GLANCE */}
      <Section
        title="At a glance"
        hint="How many people visited the website and how they browsed it."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {overviewTiles.map((t) => (
            <div key={t.label} className={card}>
              <div className="flex items-center gap-2 text-body-sm text-white-70">
                <span aria-hidden className="text-body-lg">{t.icon}</span>
                {t.label}
              </div>
              <p className="mt-2 text-title-lg font-medium tabular-nums">
                {t.value}
              </p>
              <p className="mt-1 text-body-sm text-white-70">{t.sub}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* DONATION JOURNEY (funnel) */}
      <Section
        title="Donation journey"
        hint="Follow people from landing on the site to a finished donation — the bars shrink at each step, so you can see exactly where they drop off."
      >
        <div className={`${card} flex flex-col gap-4`}>
          {funnelSteps.map((s, idx) => {
            const ofVisitors = Math.round((s.value / funnelMax) * 100);
            return (
              <div key={s.label} title={`${s.label}: ${nf(s.value)}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-body-md">
                    <span aria-hidden>{s.icon}</span>
                    {s.label}
                  </span>
                  <span className="shrink-0 text-body-sm text-white-70">
                    <span className="text-body-md font-medium text-white tabular-nums">
                      {nf(s.value)}
                    </span>
                    {idx > 0 && <> · {ofVisitors}% of visitors</>}
                  </span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-black/40">
                  <Bar
                    pct={(s.value / funnelMax) * 100}
                    className="h-full rounded-full bg-green"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* headline outcome */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`${card} flex items-center justify-between`}>
            <div>
              <p className="text-body-sm text-white-70">Total raised</p>
              <p className="mt-1 text-title-lg font-medium">
                {rupees(f.revenue)}
              </p>
            </div>
            <span aria-hidden className="text-title-lg">💰</span>
          </div>
          <div className={`${card} flex items-center justify-between`}>
            <div>
              <p className="text-body-sm text-white-70">Visitors who donated</p>
              <p className="mt-1 text-title-lg font-medium tabular-nums">
                {f.conversionRate.toFixed(1)}%
              </p>
            </div>
            <span aria-hidden className="text-title-lg">📈</span>
          </div>
        </div>
      </Section>

      {/* DONATE BUTTONS + SOURCES */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Section
          title="Which Donate button works"
          hint="Every Donate button is tracked separately — see which spot gets people clicking."
        >
          <div className={card}>
            <BarList
              items={data.donateByLocation.map((d) => ({
                label: LOCATION_LABELS[d.location] ?? d.location,
                value: d.clicks,
              }))}
              unit="clicks"
              empty="No Donate clicks recorded in this period yet."
            />
          </div>
        </Section>

        <Section
          title="Where visitors come from"
          hint="How people found the site — Google search, social media, a direct visit, and so on."
        >
          <div className={card}>
            <BarList
              items={data.sources.map((s) => ({ label: s.label, value: s.users }))}
              empty="No data yet."
            />
          </div>
        </Section>
      </div>

      {/* PAGES + CITIES */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Most-visited pages" hint="The pages people open the most.">
          <div className={card}>
            <BarList
              items={data.pages.map((p) => ({ label: p.path, value: p.views }))}
              unit="views"
              empty="No data yet."
            />
          </div>
        </Section>

        <Section title="Top cities" hint="Where your visitors are located.">
          <div className={card}>
            <BarList
              items={data.cities.map((c) => ({ label: c.city, value: c.users }))}
              empty="No data yet."
            />
          </div>
        </Section>
      </div>

      {/* DEVICES */}
      <Section
        title="Phone vs computer"
        hint="What people use to visit — handy for deciding where to focus."
      >
        <div className={card}>
          {totalDevices <= 1 ? (
            <p className="text-body-sm text-white-70">No data yet.</p>
          ) : (
            <>
              <div className="flex h-4 overflow-hidden rounded-full bg-blue-30">
                {data.devices.map((d) => (
                  <div
                    key={d.device}
                    title={`${d.device}: ${nf(d.users)}`}
                    className={`${deviceColor[d.device] ?? "bg-white-70"} border-r-2 border-black last:border-0`}
                    style={{ width: `${(d.users / totalDevices) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {data.devices.map((d) => (
                  <span key={d.device} className="flex items-center gap-2 text-body-sm">
                    <span
                      className={`h-3 w-3 rounded-full ${deviceColor[d.device] ?? "bg-white-70"}`}
                      aria-hidden
                    />
                    <span className="capitalize">{d.device}</span>
                    <span className="text-white-70">
                      {nf(d.users)} · {Math.round((d.users / totalDevices) * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </Section>

      <p className="mt-8 flex flex-wrap items-center gap-1 text-body-sm text-white-70">
        Numbers refresh a few times an hour and cover the selected period. For the
        full picture,{" "}
        <a
          href={gaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-white underline"
        >
          open Google Analytics ↗
        </a>
        .
      </p>
    </div>
  );
}
