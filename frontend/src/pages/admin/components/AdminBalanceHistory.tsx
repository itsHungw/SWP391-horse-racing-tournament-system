import { useEffect, useState } from "react";
import { getAdminUserWalletTransactions } from "../../../api/adminUserApi";
import { PaginationControls } from "../../../components/common/PaginationControls";
import type { AdminWalletTransaction, PageResponse } from "../../../types/adminUser";
import { formatVnd } from "../../../utils/money";

const PAGE_SIZE = 20;
const TYPE_LABELS: Record<string, string> = {
  TOPUP: "Top up",
  BET_PLACED: "Bet placed",
  BET_PAYOUT: "Bet payout",
  BET_REFUND: "Bet refund",
  WITHDRAWAL_HOLD: "Withdrawal hold",
  WITHDRAWAL_REFUND: "Withdrawal refund",
  ADMIN_ADJUSTMENT: "Admin adjustment",
};

function signedAmount(amount: number) {
  return `${amount > 0 ? "+" : ""}${formatVnd(amount)}`;
}

function reference(transaction: AdminWalletTransaction) {
  if (!transaction.referenceType) return "—";
  return `${transaction.referenceType}${transaction.referenceId == null ? "" : ` #${transaction.referenceId}`}`;
}

export function AdminBalanceHistory({ userId }: { userId: number }) {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<PageResponse<AdminWalletTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getAdminUserWalletTransactions(userId, page, PAGE_SIZE)
      .then((data) => { if (active) setResult(data); })
      .catch(() => { if (active) setError("Unable to load balance history"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, reloadKey, userId]);

  if (loading) return <p className="py-12 text-center text-sm text-slate-500" role="status">Loading balance history…</p>;
  if (error) {
    return <div className="py-12 text-center"><p className="text-sm font-semibold text-rose-700" role="alert">{error}</p><button type="button" className="mt-4 min-h-11 rounded-full border border-slate-300 px-5 text-sm font-black" onClick={() => setReloadKey((value) => value + 1)}>Retry</button></div>;
  }
  if (!result || result.content.length === 0) return <p className="py-12 text-center text-sm text-slate-500">No wallet transactions yet.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Time</th>
              <th scope="col" className="px-4 py-3">Transaction</th>
              <th scope="col" className="px-4 py-3 text-right">Amount</th>
              <th scope="col" className="px-4 py-3 text-right">Before</th>
              <th scope="col" className="px-4 py-3 text-right">After</th>
              <th scope="col" className="px-4 py-3">Reference</th>
              <th scope="col" className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.content.map((transaction) => (
              <tr key={transaction.id} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(transaction.createdAt).toLocaleString()}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{TYPE_LABELS[transaction.type] ?? transaction.type}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-black ${transaction.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{signedAmount(transaction.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{transaction.balanceBefore == null ? "—" : formatVnd(transaction.balanceBefore)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">{transaction.balanceAfter == null ? "—" : formatVnd(transaction.balanceAfter)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-500">{reference(transaction)}</td>
                <td className="min-w-64 px-4 py-3 text-slate-600">{transaction.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls currentPage={page + 1} onPageChange={(nextPage) => setPage(nextPage - 1)} pageSize={PAGE_SIZE} totalItems={result.totalElements} />
    </div>
  );
}
