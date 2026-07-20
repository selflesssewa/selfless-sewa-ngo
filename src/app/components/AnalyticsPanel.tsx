"use client";

import { useEffect, useState } from "react";

type TAnalytics = {
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

const card =
  "rounded-[0.8rem] border border-white-30 px-4 py-3 flex flex-col gap-1";
const th = "text-body-sm text-white-70 font-medium";

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
    <section className="mt-8">
      <h3 className="text-title-md font-medium">{title}</h3>
      <p className="mb-3 mt-1 text-body-sm text-white-70">{hint}</p>
      {children}
    </section>
  );
}

function MiniTable({
  head,
  rows,
  empty,
}: {
  head: [string, string];
  rows: Array<[string, string | number]>;
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-[0.8rem] border border-white-30">
      <table className="w-full border-collapse text-body-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left">
        <thead>
          <tr className="border-b border-white-30">
            <th className={th}>{head[0]}</th>
            <th className={`${th} text-right`}>{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2} className="py-4 text-center text-white-70">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map(([a, b], i) => (
              <tr key={i} className="border-b border-white-30 last:border-0">
                <td>{a}</td>
                <td className="text-right font-medium">{b}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
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

  if (loading && !data) {
    return <p className="mt-6 animate-pulse text-white-70">Loading traffic…</p>;
  }

  if (data && !data.configured) {
    return (
      <div className="mt-6 rounded-[0.8rem] border border-yellow-500/40 bg-yellow-500/10 p-4 text-body-sm">
        <p className="font-medium text-yellow-100">
          Analytics isn&apos;t connected yet.
        </p>
        <p className="mt-1 text-white-70">
          Traffic tracking is live on the website, but this panel needs a
          Google service account to read it. Once that&apos;s set up, all your
          visitor and donation numbers show up here automatically.
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

  return (
    <div>
      {/* date range */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-body-sm text-white-70">Showing the last</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-[0.6rem] px-3 py-1 text-body-sm font-medium transition-colors ${
              days === d ? "bg-green-50 text-white" : "border border-white-30 text-white-70"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {data.error && (
        <p className="mt-3 rounded-[0.6rem] border border-red-400/40 bg-red-400/10 p-2 text-body-sm text-red-200">
          Google returned an error: {data.error}
        </p>
      )}

      {/* AT A GLANCE */}
      <Section
        title="At a glance"
        hint="A quick summary of how many people visited the website and how they browsed it."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className={card}>
            <span className="text-body-sm text-white-70">Visitors</span>
            <span className="text-title-lg font-medium">{nf(o.users)}</span>
            <span className="text-body-sm text-white-70">
              {nf(data.last7Users)} in the last 7 days
            </span>
          </div>
          <div className={card}>
            <span className="text-body-sm text-white-70">New visitors</span>
            <span className="text-title-lg font-medium">{nf(o.newUsers)}</span>
            <span className="text-body-sm text-white-70">first-time here</span>
          </div>
          <div className={card}>
            <span className="text-body-sm text-white-70">Visits</span>
            <span className="text-title-lg font-medium">{nf(o.sessions)}</span>
            <span className="text-body-sm text-white-70">total sessions</span>
          </div>
          <div className={card}>
            <span className="text-body-sm text-white-70">Pages viewed</span>
            <span className="text-title-lg font-medium">{nf(o.pageviews)}</span>
            <span className="text-body-sm text-white-70">pages opened</span>
          </div>
          <div className={card}>
            <span className="text-body-sm text-white-70">Avg. time on site</span>
            <span className="text-title-lg font-medium">
              {mmss(o.avgSessionSec)}
            </span>
            <span className="text-body-sm text-white-70">per visit</span>
          </div>
        </div>
      </Section>

      {/* DONATION FUNNEL */}
      <Section
        title="Donation journey"
        hint="This follows people from clicking a Donate button all the way to a completed donation — so you can see where you lose them."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Clicked Donate", value: nf(f.donateClicks), sub: "opened the donation flow" },
            { label: "Started payment", value: nf(f.checkouts), sub: "filled the form & continued" },
            { label: "Donations completed", value: nf(f.donations), sub: "paid successfully" },
            { label: "Total raised", value: rupees(f.revenue), sub: "from these donations" },
          ].map((s) => (
            <div key={s.label} className={card}>
              <span className="text-body-sm text-white-70">{s.label}</span>
              <span className="text-title-lg font-medium">{s.value}</span>
              <span className="text-body-sm text-white-70">{s.sub}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-body-sm text-white-70">
          <span className="font-medium text-white">
            {f.conversionRate.toFixed(1)}%
          </span>{" "}
          of all visitors completed a donation.
        </p>
      </Section>

      {/* DONATE BUTTON LOCATIONS */}
      <Section
        title="Which Donate button gets clicked"
        hint="Every Donate button on the site is tracked separately, so you can see which spot works best."
      >
        <MiniTable
          head={["Button location", "Clicks"]}
          rows={data.donateByLocation.map((d) => [
            LOCATION_LABELS[d.location] ?? d.location,
            nf(d.clicks),
          ])}
          empty="No Donate clicks recorded in this period yet."
        />
      </Section>

      {/* SOURCES */}
      <Section
        title="Where visitors come from"
        hint="How people found the website — e.g. Google search, social media, or by typing the address directly."
      >
        <MiniTable
          head={["Source", "Visitors"]}
          rows={data.sources.map((s) => [s.label, nf(s.users)])}
          empty="No data yet."
        />
      </Section>

      {/* PAGES + CITIES side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Most-visited pages"
          hint="Which pages people open the most."
        >
          <MiniTable
            head={["Page", "Views"]}
            rows={data.pages.map((p) => [p.path, nf(p.views)])}
            empty="No data yet."
          />
        </Section>
        <Section
          title="Top cities"
          hint="Where your visitors are located."
        >
          <MiniTable
            head={["City", "Visitors"]}
            rows={data.cities.map((c) => [c.city, nf(c.users)])}
            empty="No data yet."
          />
        </Section>
      </div>

      {/* DEVICES */}
      <Section
        title="Phone vs computer"
        hint="What kind of device people use to visit — useful to know where to focus."
      >
        <MiniTable
          head={["Device", "Visitors"]}
          rows={data.devices.map((d) => [
            d.device.charAt(0).toUpperCase() + d.device.slice(1),
            nf(d.users),
          ])}
          empty="No data yet."
        />
      </Section>

      <p className="mt-8 text-body-sm text-white-70">
        Numbers refresh a few times an hour and cover the selected period.
        Powered by Google Analytics.
      </p>
    </div>
  );
}
