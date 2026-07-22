import { useCallback, useEffect, useState } from "react";

import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { adminWalletApi } from "../../api/adminWalletApi";
import type { AdminWithdrawalRow, WithdrawalStatus } from "../../types/wallet";

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

  const [rows, setRows] = useState<AdminWithdrawalRow[]>([]);
  const [filter, setFilter] = useState<WithdrawalStatus | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminWalletApi.listWithdrawals({
        status: filter || undefined,
        page: 0,
        size: 100,
      });
      setRows(response.content);
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

  async function act(action: "approve" | "reject" | "markPaid", row: AdminWithdrawalRow) {
    let note = "";
    if (action === "reject") {
      note = window.prompt("Reason for rejection:") ?? "";
      if (!note.trim()) return;
    }
    setBusyId(row.id);
    try {
      if (action === "approve") {
        await adminWalletApi.approve(row.id, { riskAcknowledged: false, internalNote: "" });
      } else if (action === "reject") {
        await adminWalletApi.reject(row.id, { publicReason: note.trim(), internalNote: "" });
      } else {
        const transferReference = window.prompt("Bank transfer reference:")?.trim();
        if (!transferReference) return;
        await adminWalletApi.markPaid(row.id, { transferReference, internalNote: "" });
      }
      await load();
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="relative space-y-6">
        {/* Title Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">Finance Operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">Withdrawal Requests</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review and settle wallet withdrawals. Approving holds the request; mark as paid after the bank transfer.
          </p>
        </div>

        {/* Operations Filter Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#b3193a]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Filter by status
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors outline-none ${
                  filter === f.value
                    ? "border-[#b3193a] bg-[#b3193a] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 font-bold">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 font-bold">
                    No withdrawal requests.
                  </td>
                </tr>
              ) : (
                rows.map((w) => (
                  <tr key={w.id} className="align-top hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{w.userName ?? "—"}</p>
                      <p className="text-xs text-slate-500">{w.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{vnd.format(w.amount)} VND</td>
                    <td className="px-4 py-3 max-w-[220px] text-slate-600 font-medium">
                      {w.bankName ?? w.bankCode ?? "Legacy destination"} · {w.maskedAccountNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[w.status]}`}
                      >
                        {w.status}
                      </span>
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
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-black text-white hover:bg-sky-700 shadow-sm transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === w.id}
                              onClick={() => act("reject", w)}
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
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
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                            >
                              Mark paid
                            </button>
                            <button
                              type="button"
                              disabled={busyId === w.id}
                              onClick={() => act("reject", w)}
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">—</span>
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
