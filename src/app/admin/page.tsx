"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "../components/Container";

type TDonation = {
  txn_id: string;
  amount: number;
  status: string;
  donor_name: string | null;
  donor_contact: string | null;
  donor_email: string | null;
  donor_pan: string | null;
  donor_address: string | null;
  wants_receipt: boolean;
  payment_mode: string | null;
  drive_file_link: string | null;
  drive_file_id: string | null;
  archive_error: string | null;
  created_at: string;
};

type TSubscription = {
  id: string;
  merchant_subscription_id: string;
  donor_name: string | null;
  donor_contact: string | null;
  donor_email: string | null;
  amount: number;
  frequency: string;
  status: string;
  next_charge_at: string | null;
  created_at: string;
  charges_count: number;
  failed_count: number;
  total_collected: number;
  last_charge_at: string | null;
  archive_pending: number;
};

type TReceiptFilter = "all" | "with" | "without";
type TStatusFilter = "all" | "COMPLETED" | "PENDING" | "FAILED";
type TSubStatusFilter =
  | "all"
  | "ACTIVE"
  | "PAUSED"
  | "CANCELLED"
  | "FAILED"
  | "PENDING";
type TTab = "onetime" | "recurring";

const FREQUENCY_LABEL: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Every 3 months",
  HALFYEARLY: "Every 6 months",
  YEARLY: "Yearly",
};

// Local YYYY-MM-DD for a timestamp (so day/month filters match the dates shown).
const localYMD = (iso: string) => {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const STORAGE_KEY = "ss_admin_key";

const Page = () => {
  const [key, setKey] = useState("");
  const [donations, setDonations] = useState<TDonation[] | null>(null);
  const [subscriptions, setSubscriptions] = useState<TSubscription[]>([]);
  const [tab, setTab] = useState<TTab>("onetime");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>("all");
  const [receiptFilter, setReceiptFilter] = useState<TReceiptFilter>("all");
  const [subStatusFilter, setSubStatusFilter] =
    useState<TSubStatusFilter>("all");
  const [month, setMonth] = useState(""); // YYYY-MM
  const [day, setDay] = useState(""); // YYYY-MM-DD

  const fetchDonations = async (adminKey: string) => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/donations", {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (res.status === 401) {
        setError("Wrong key.");
        setDonations(null);
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        const data = await res.json();
        setDonations(data.donations ?? []);
        sessionStorage.setItem(STORAGE_KEY, adminKey);
        fetchSubscriptions(adminKey);
      }
    } catch {
      setError("Could not load donations.");
    }
    setLoading(false);
  };

  const fetchSubscriptions = async (adminKey: string) => {
    if (!adminKey) return;
    try {
      const res = await fetch("/api/admin/subscriptions", {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions ?? []);
      }
    } catch {
      // Non-fatal: the one-time view still works without subscriptions.
    }
  };

  // Stay logged in for the session.
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setKey(saved);
      fetchDonations(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!donations) return [];
    const q = search.trim().toLowerCase();
    return donations.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (receiptFilter === "with" && !d.wants_receipt) return false;
      if (receiptFilter === "without" && d.wants_receipt) return false;
      const ymd = localYMD(d.created_at);
      if (day && ymd !== day) return false;
      if (month && !ymd.startsWith(month)) return false;
      if (q) {
        const hay = `${d.donor_name ?? ""} ${d.donor_contact ?? ""} ${
          d.donor_email ?? ""
        } ${d.txn_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [donations, search, statusFilter, receiptFilter, month, day]);

  const totalReceived = useMemo(
    () =>
      filtered
        .filter((d) => d.status === "COMPLETED")
        .reduce((sum, d) => sum + d.amount, 0),
    [filtered],
  );

  const filteredSubscriptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptions.filter((s) => {
      if (subStatusFilter !== "all" && s.status !== subStatusFilter)
        return false;
      const ymd = localYMD(s.created_at);
      if (day && ymd !== day) return false;
      if (month && !ymd.startsWith(month)) return false;
      if (q) {
        const hay = `${s.donor_name ?? ""} ${s.donor_contact ?? ""} ${
          s.donor_email ?? ""
        } ${s.merchant_subscription_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [subscriptions, search, subStatusFilter, month, day]);

  const recurringCollected = useMemo(
    () =>
      filteredSubscriptions.reduce((sum, s) => sum + (s.total_collected ?? 0), 0),
    [filteredSubscriptions],
  );

  // ---- Summary metrics (across ALL data, ignoring the one-time filters) ----
  const summary = useMemo(() => {
    const all = donations ?? [];
    const nowMonth = localYMD(new Date().toISOString()).slice(0, 7); // YYYY-MM

    const oneTimeCompleted = all.filter((d) => d.status === "COMPLETED");
    const oneTimeTotal = oneTimeCompleted.reduce((s, d) => s + d.amount, 0);
    const oneTimeThisMonth = oneTimeCompleted
      .filter((d) => localYMD(d.created_at).startsWith(nowMonth))
      .reduce((s, d) => s + d.amount, 0);

    const recurringTotal = subscriptions.reduce(
      (s, x) => s + (x.total_collected ?? 0),
      0,
    );
    const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
    // All mandates are monthly, so MRR = sum of active monthly amounts.
    const mrr = activeSubs.reduce((s, x) => s + x.amount, 0);

    return {
      totalRaised: oneTimeTotal + recurringTotal,
      thisMonth: oneTimeThisMonth, // recurring charge dates roll monthly; approx via one-time
      activeDonors: activeSubs.length,
      mrr,
      pending: all.filter((d) => d.status === "PENDING").length,
    };
  }, [donations, subscriptions]);

  // ---- Needs attention ----
  const attention = useMemo(() => {
    const all = donations ?? [];
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    const failedCharges = subscriptions.filter((s) => s.failed_count > 0);
    const archiveStuck = [
      ...all.filter((d) => d.status === "COMPLETED" && d.archive_error),
      ...subscriptions.filter((s) => s.archive_pending > 0 && s.failed_count === 0),
    ];
    // One-time payments stuck PENDING for more than a day (donor likely dropped).
    const stalePending = all.filter(
      (d) =>
        d.status === "PENDING" && now - new Date(d.created_at).getTime() > DAY,
    );

    return { failedCharges, archiveStuck, stalePending };
  }, [donations, subscriptions]);

  const attentionCount =
    attention.failedCharges.length +
    attention.archiveStuck.length +
    attention.stalePending.length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setReceiptFilter("all");
    setSubStatusFilter("all");
    setMonth("");
    setDay("");
  };

  const exportCsv = () => {
    const head = [
      "Date",
      "Transaction ID",
      "Amount",
      "Status",
      "Name",
      "Phone",
      "Email",
      "Wants receipt",
      "PAN",
      "Address",
      "Payment mode",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const rows = filtered.map((d) =>
      [
        fmt(d.created_at),
        d.txn_id,
        d.amount,
        d.status,
        d.donor_name,
        d.donor_contact,
        d.donor_email,
        d.wants_receipt ? "Yes" : "No",
        d.donor_pan,
        d.donor_address,
        d.payment_mode,
      ]
        .map(esc)
        .join(","),
    );
    const csv = [head.map(esc).join(","), ...rows].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportRecurringCsv = () => {
    const head = [
      "Started",
      "Merchant subscription ID",
      "Name",
      "Phone",
      "Email",
      "Amount",
      "Frequency",
      "Status",
      "Successful charges",
      "Failed charges",
      "Total collected",
      "Next charge",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const rows = filteredSubscriptions.map((s) =>
      [
        fmt(s.created_at),
        s.merchant_subscription_id,
        s.donor_name,
        s.donor_contact,
        s.donor_email,
        s.amount,
        FREQUENCY_LABEL[s.frequency] ?? s.frequency,
        s.status,
        s.charges_count,
        s.failed_count,
        s.total_collected,
        s.next_charge_at ? fmt(s.next_charge_at) : "",
      ]
        .map(esc)
        .join(","),
    );
    const csv = [head.map(esc).join(","), ...rows].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `recurring_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [cancelling, setCancelling] = useState<string | null>(null);
  const cancelMandate = async (merchantSubscriptionId: string, name: string) => {
    if (
      !confirm(
        `Cancel the recurring donation from ${name || "this donor"}? They will not be charged again.`,
      )
    )
      return;
    setCancelling(merchantSubscriptionId);
    try {
      const res = await fetch("/api/admin/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ merchantSubscriptionId }),
      });
      if (res.ok) {
        await fetchSubscriptions(key);
      } else {
        alert("Could not cancel. Please try again.");
      }
    } catch {
      alert("Could not cancel. Please try again.");
    }
    setCancelling(null);
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  const inputCls =
    "rounded-[0.6rem] border border-white-30 bg-transparent px-3 py-2 text-white placeholder:text-white-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-50 [&>option]:text-black";

  // ---- Login gate ----
  if (!donations) {
    return (
      <main className="min-h-[70vh]">
        <Container className="my-12 flex justify-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchDonations(key);
            }}
            className="w-full max-w-sm"
          >
            <h1 className="mb-6 text-headline-sm">Donations admin</h1>
            <label htmlFor="adminkey" className="mb-2 block text-body-sm">
              Admin key
            </label>
            <div className="flex gap-2">
              <input
                id="adminkey"
                type="password"
                value={key}
                placeholder="Enter admin key"
                autoFocus
                onChange={(e) => setKey(e.target.value)}
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-[0.6rem] bg-green-50 px-4 py-2 font-medium"
              >
                {loading ? "…" : "Sign in"}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-3 text-red-400">
                {error}
              </p>
            )}
          </form>
        </Container>
      </main>
    );
  }

  // ---- Dashboard ----
  return (
    <main className="min-h-[70vh]">
      <Container className="my-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-headline-sm">Donations</h1>
            <p className="mt-1 text-body-sm text-white-70">
              {tab === "onetime" ? (
                <>
                  {filtered.length} of {donations.length} shown ·{" "}
                  <span className="font-medium text-white">
                    ₹{totalReceived.toLocaleString("en-IN")}
                  </span>{" "}
                  received
                </>
              ) : (
                <>
                  {filteredSubscriptions.length} of {subscriptions.length}{" "}
                  recurring ·{" "}
                  <span className="font-medium text-white">
                    ₹{recurringCollected.toLocaleString("en-IN")}
                  </span>{" "}
                  collected
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchDonations(key)}
              className="rounded-[0.6rem] border border-white-30 px-3 py-2 text-body-sm"
            >
              Refresh
            </button>
            {tab === "onetime" ? (
              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="rounded-[0.6rem] bg-green-50 px-3 py-2 text-body-sm font-medium disabled:opacity-50"
              >
                Export CSV
              </button>
            ) : (
              <button
                onClick={exportRecurringCsv}
                disabled={filteredSubscriptions.length === 0}
                className="rounded-[0.6rem] bg-green-50 px-3 py-2 text-body-sm font-medium disabled:opacity-50"
              >
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              label: "Total raised",
              value: `₹${summary.totalRaised.toLocaleString("en-IN")}`,
            },
            {
              label: "One-time this month",
              value: `₹${summary.thisMonth.toLocaleString("en-IN")}`,
            },
            {
              label: "Recurring / month",
              value: `₹${summary.mrr.toLocaleString("en-IN")}`,
            },
            {
              label: "Active recurring",
              value: summary.activeDonors.toLocaleString("en-IN"),
            },
            {
              label: "Pending",
              value: summary.pending.toLocaleString("en-IN"),
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-[0.8rem] border border-white-30 px-4 py-3"
            >
              <p className="text-body-sm text-white-70">{c.label}</p>
              <p className="mt-1 text-title-lg font-medium">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Needs attention */}
        {attentionCount > 0 && (
          <details className="mb-6 rounded-[0.8rem] border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
            <summary className="cursor-pointer text-body-sm font-medium text-yellow-200">
              ⚠ {attentionCount} item{attentionCount === 1 ? "" : "s"} need
              attention
            </summary>
            <div className="mt-3 flex flex-col gap-3 text-body-sm">
              {attention.failedCharges.length > 0 && (
                <div>
                  <p className="font-medium text-yellow-100">
                    Failed recurring charges ({attention.failedCharges.length})
                  </p>
                  <ul className="mt-1 list-inside list-disc text-white-70">
                    {attention.failedCharges.map((s) => (
                      <li key={s.id}>
                        {s.donor_name ?? "—"} · ₹{s.amount} ·{" "}
                        {s.failed_count} failed
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {attention.archiveStuck.length > 0 && (
                <div>
                  <p className="font-medium text-yellow-100">
                    Receipts not yet in Drive ({attention.archiveStuck.length})
                  </p>
                  <p className="mt-1 text-white-70">
                    Usually self-heals via the archive cron. If it persists,
                    check Drive credentials.
                  </p>
                </div>
              )}
              {attention.stalePending.length > 0 && (
                <div>
                  <p className="font-medium text-yellow-100">
                    One-time payments stuck pending ({attention.stalePending.length})
                  </p>
                  <ul className="mt-1 list-inside list-disc text-white-70">
                    {attention.stalePending.slice(0, 10).map((d) => (
                      <li key={d.txn_id}>
                        {d.donor_name ?? "—"} · ₹{d.amount} · {fmt(d.created_at)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-[0.9rem] bg-blue-30 p-1 sm:w-fit">
          <button
            onClick={() => setTab("onetime")}
            className={`rounded-[0.6rem] px-4 py-2 text-body-sm font-medium transition-colors ${
              tab === "onetime" ? "bg-green-50 text-white" : "text-white-70"
            }`}
          >
            One-time
          </button>
          <button
            onClick={() => setTab("recurring")}
            className={`rounded-[0.6rem] px-4 py-2 text-body-sm font-medium transition-colors ${
              tab === "recurring" ? "bg-green-50 text-white" : "text-white-70"
            }`}
          >
            Recurring ({subscriptions.length})
          </button>
        </div>

        {tab === "recurring" ? (
          <>
          {/* Recurring filters */}
          <fieldset className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <legend className="sr-only">Filters</legend>

            <div className="flex flex-col gap-1 lg:col-span-2">
              <label htmlFor="rsearch" className="text-body-sm text-white-70">
                Search name / phone / email
              </label>
              <input
                id="rsearch"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Asha or 98765"
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="rstatus" className="text-body-sm text-white-70">
                Status
              </label>
              <select
                id="rstatus"
                value={subStatusFilter}
                onChange={(e) =>
                  setSubStatusFilter(e.target.value as TSubStatusFilter)
                }
                className={inputCls}
              >
                <option value="all">All</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="rmonth" className="text-body-sm text-white-70">
                Month
              </label>
              <input
                id="rmonth"
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setDay("");
                }}
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="rday" className="text-body-sm text-white-70">
                Day
              </label>
              <input
                id="rday"
                type="date"
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  setMonth("");
                }}
                className={inputCls}
              />
            </div>
          </fieldset>

          {(search || subStatusFilter !== "all" || month || day) && (
            <button
              onClick={clearFilters}
              className="mb-4 text-body-sm text-blue-300 underline"
            >
              Clear filters
            </button>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body-sm [&_td]:border-b [&_td]:border-white-30 [&_td]:px-2 [&_td]:py-2 [&_th]:border-b [&_th]:border-white-30 [&_th]:px-2 [&_th]:py-2 [&_th]:text-left">
              <caption className="sr-only">List of recurring donors</caption>
              <thead>
                <tr>
                  <th scope="col">Started</th>
                  <th scope="col">Name</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Email</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Frequency</th>
                  <th scope="col">Status</th>
                  <th scope="col">Charges</th>
                  <th scope="col">Collected</th>
                  <th scope="col">Next charge</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-6 text-center text-white-70">
                      {subscriptions.length === 0
                        ? "No recurring donors yet."
                        : "No recurring donors match these filters."}
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((s) => (
                    <tr key={s.id}>
                      <td className="whitespace-nowrap">{fmt(s.created_at)}</td>
                      <td>{s.donor_name ?? "—"}</td>
                      <td>{s.donor_contact ?? "—"}</td>
                      <td>{s.donor_email ?? "—"}</td>
                      <td>₹{s.amount.toLocaleString("en-IN")}</td>
                      <td>{FREQUENCY_LABEL[s.frequency] ?? s.frequency}</td>
                      <td>
                        {s.status}
                        {s.failed_count > 0 && (
                          <span className="ml-1 text-yellow-300">
                            ⚠ {s.failed_count}
                          </span>
                        )}
                      </td>
                      <td>{s.charges_count}</td>
                      <td>₹{s.total_collected.toLocaleString("en-IN")}</td>
                      <td className="whitespace-nowrap">
                        {s.status === "ACTIVE" && s.next_charge_at
                          ? fmt(s.next_charge_at)
                          : "—"}
                      </td>
                      <td>
                        {s.status === "ACTIVE" ? (
                          <button
                            onClick={() =>
                              cancelMandate(
                                s.merchant_subscription_id,
                                s.donor_name ?? "",
                              )
                            }
                            disabled={
                              cancelling === s.merchant_subscription_id
                            }
                            className="text-red-300 underline disabled:opacity-50"
                          >
                            {cancelling === s.merchant_subscription_id
                              ? "Cancelling…"
                              : "Cancel"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </>
        ) : (
        <>
        {/* Filters */}
        <fieldset className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <legend className="sr-only">Filters</legend>

          <div className="flex flex-col gap-1 lg:col-span-2">
            <label htmlFor="search" className="text-body-sm text-white-70">
              Search name / phone / email
            </label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Asha or 98765"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-body-sm text-white-70">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TStatusFilter)}
              className={inputCls}
            >
              <option value="all">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="receipt" className="text-body-sm text-white-70">
              Receipt
            </label>
            <select
              id="receipt"
              value={receiptFilter}
              onChange={(e) =>
                setReceiptFilter(e.target.value as TReceiptFilter)
              }
              className={inputCls}
            >
              <option value="all">All</option>
              <option value="with">With receipt</option>
              <option value="without">Without receipt</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="month" className="text-body-sm text-white-70">
              Month
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setDay("");
              }}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="day" className="text-body-sm text-white-70">
              Day
            </label>
            <input
              id="day"
              type="date"
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                setMonth("");
              }}
              className={inputCls}
            />
          </div>
        </fieldset>

        {(search || statusFilter !== "all" || receiptFilter !== "all" || month || day) && (
          <button
            onClick={clearFilters}
            className="mb-4 text-body-sm text-blue-300 underline"
          >
            Clear filters
          </button>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-body-sm [&_td]:border-b [&_td]:border-white-30 [&_td]:px-2 [&_td]:py-2 [&_th]:border-b [&_th]:border-white-30 [&_th]:px-2 [&_th]:py-2 [&_th]:text-left">
            <caption className="sr-only">List of donations</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col">Name</th>
                <th scope="col">Phone</th>
                <th scope="col">Email</th>
                <th scope="col">Receipt</th>
                <th scope="col">Drive</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-white-70">
                    No donations match these filters.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.txn_id}>
                    <td className="whitespace-nowrap">{fmt(d.created_at)}</td>
                    <td>₹{d.amount.toLocaleString("en-IN")}</td>
                    <td>{d.status}</td>
                    <td>{d.donor_name ?? "—"}</td>
                    <td>{d.donor_contact ?? "—"}</td>
                    <td>{d.donor_email ?? "—"}</td>
                    <td>
                      {d.wants_receipt && d.status === "COMPLETED" ? (
                        <a
                          className="text-blue-300 underline"
                          href={`/api/admin/receipt?txnId=${d.txn_id}&key=${encodeURIComponent(
                            key,
                          )}`}
                        >
                          Download
                        </a>
                      ) : d.wants_receipt ? (
                        "Requested"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {d.drive_file_link ? (
                        <a
                          className="text-blue-300 underline"
                          href={d.drive_file_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
        )}
      </Container>
    </main>
  );
};

export default Page;
