import { useCallback, useEffect, useState } from "react";

import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { adminWalletApi } from "../../api/adminWalletApi";
import type { Withdrawal, WithdrawalStatus } from "../../types/wallet";

const vnd = new Intl.NumberFormat("en-US");

const FILTERS: Array<{ label: string; value: WithdrawalStatus | "" }> = [
  { label: "All", value: "" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Paid", value: "PAID" },
  { label: "Rejected", value: "REJECTED" },
];

const STATUS_STYLE: Record<WithdrawalStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-sky-100 text-sky-800 border-sky-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminWithdrawalsPage() {
  useDocumentTitle("Withdrawal requests");

  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [filter, setFilter] = useState<WithdrawalStatus | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminWalletApi.listWithdrawals(filter || undefined));
    } catch {
      setRows([]);
      setError("Unable to load withdrawal requests.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: "approve" | "reject" | "markPaid", row: Withdrawal) {
    let note = "";
    if (action === "reject") {
      note = window.prompt("Reason for rejection:") ?? "";
      if (!note.trim()) return;
    }
    setBusyId(row.id);
    try {
      if (action === "approve") await adminWalletApi.approve(row.id);
      else if (action === "reject") await adminWalletApi.reject(row.id, note.trim());
      else await adminWalletApi.markPaid(row.id);
      await load();
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-black text-slate-900">Withdrawal requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and settle wallet withdrawals. Approving holds the request; mark as paid after the bank transfer.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Bank info</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No withdrawal requests.
                  </td>
                </tr>
              ) : (
                rows.map((w) => (
                  <tr key={w.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{w.userName ?? "—"}</p>
                      <p className="text-xs text-slate-500">{w.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{vnd.format(w.amount)} VND</td>
                    <td className="px-4 py-3 max-w-[220px] text-slate-600">{w.bankInfo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[w.status]}`}
                      >
                        {w.status}
                      </span>
                      {w.reviewNote ? <p className="mt-1 text-xs text-slate-400">{w.reviewNote}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(w.requestedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {w.status === "REQUESTED" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === w.id}
                              onClick={() => act("approve", w)}
                              className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === w.id}
                              onClick={() => act("reject", w)}
                              className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : w.status === "APPROVED" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === w.id}
                              onClick={() => act("markPaid", w)}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Mark paid
                            </button>
                            <button
                              type="button"
                              disabled={busyId === w.id}
                              onClick={() => act("reject", w)}
                              className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
