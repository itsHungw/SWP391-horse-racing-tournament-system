import { ArrowUpRight, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";

import type { AdminFinanceTransaction, FinanceRange } from "../../../types/adminFinance";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function FinanceRecentTransactions({
  rows,
  range,
  onSelect,
}: {
  rows: AdminFinanceTransaction[];
  range: FinanceRange;
  onSelect: (transaction: AdminFinanceTransaction, trigger: HTMLButtonElement) => void;
}) {
  const search = new URLSearchParams({ from: range.from, to: range.to });

  return (
    <section aria-labelledby="recent-transactions-title" className="border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Immutable ledger</p><h2 className="mt-1 text-xl font-black text-[#070f4f]" id="recent-transactions-title">Recent transactions</h2></div>
        <Link className="inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm font-black text-[#070f4f] hover:text-[#b3193a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b3193a]" to={`/admin/finance/transactions?${search.toString()}`}>View full history <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-slate-500"><ReceiptText className="mx-auto h-7 w-7" aria-hidden="true" /><p className="mt-3 font-semibold">No wallet transactions in this period.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table aria-label="Recent wallet transactions" className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-4 py-3">Recorded</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Balance after</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr className="hover:bg-slate-50" key={row.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">{new Date(row.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-4"><p className="font-black text-slate-900">{row.userName}</p><p className="text-xs text-slate-500">{row.userEmail}</p></td>
                  <td className="px-4 py-4 text-xs font-black text-slate-700">{row.transactionType.replaceAll("_", " ")}</td>
                  <td className={`px-4 py-4 text-right font-mono font-black tabular-nums ${row.amount >= 0 ? "text-emerald-700" : "text-[#b3193a]"}`}>{row.amount >= 0 ? "+" : ""}{vnd.format(row.amount)}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold tabular-nums text-slate-700">{row.balanceAfter == null ? "—" : vnd.format(row.balanceAfter)}</td>
                  <td className="px-4 py-4 text-right"><button aria-label={`View transaction ${row.id}`} className="min-h-11 border border-slate-300 px-3 text-xs font-black text-[#070f4f] hover:border-[#070f4f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]" onClick={(event) => onSelect(row, event.currentTarget)} type="button">Inspect</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
