"use client";

import { useState } from "react";
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

const Page = () => {
  const [key, setKey] = useState("");
  const [donations, setDonations] = useState<TDonation[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/donations", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.status === 401) {
        setError("Wrong key.");
        setDonations(null);
      } else {
        const data = await res.json();
        setDonations(data.donations ?? []);
      }
    } catch {
      setError("Could not load donations.");
    }
    setLoading(false);
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <main className="min-h-[70vh]">
      <Container className="my-12">
        <h1 className="mb-6 text-headline-sm">Donations</h1>

        <form onSubmit={load} className="mb-8 flex max-w-md gap-2">
          <input
            type="password"
            value={key}
            placeholder="Admin key"
            onChange={(e) => setKey(e.target.value)}
            className="flex-1 rounded-[0.8rem] border border-white-30 bg-transparent px-3 py-2 text-white placeholder:text-white-70 focus-within:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[0.8rem] bg-green-50 px-4 py-2 font-medium"
          >
            {loading ? "Loading..." : "Load"}
          </button>
        </form>

        {error && <p className="mb-4 text-red-400">{error}</p>}

        {donations && (
          <>
            <p className="mb-3 text-body-sm text-white-70">
              {donations.length} donation(s)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body-sm [&_td]:border-b [&_td]:border-white-30 [&_td]:px-2 [&_td]:py-2 [&_th]:border-b [&_th]:border-white-30 [&_th]:px-2 [&_th]:py-2 [&_th]:text-left">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.txn_id}>
                      <td className="whitespace-nowrap">{fmt(d.created_at)}</td>
                      <td>₹{d.amount}</td>
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
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
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
