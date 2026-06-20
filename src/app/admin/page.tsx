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
  created_at: string;
};

type TReceiptFilter = "all" | "with" | "without";
type TStatusFilter = "all" | "COMPLETED" | "PENDING" | "FAILED";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>("all");
  const [receiptFilter, setReceiptFilter] = useState<TReceiptFilter>("all");
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
      }
    } catch {
      setError("Could not load donations.");
    }
    setLoading(false);
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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setReceiptFilter("all");
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
              {filtered.length} of {donations.length} shown ·{" "}
              <span className="font-medium text-white">
                ₹{totalReceived.toLocaleString("en-IN")}
              </span>{" "}
              received
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchDonations(key)}
              className="rounded-[0.6rem] border border-white-30 px-3 py-2 text-body-sm"
            >
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="rounded-[0.6rem] bg-green-50 px-3 py-2 text-body-sm font-medium disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-white-70">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>
    </main>
  );
};

export default Page;
