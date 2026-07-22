import { ArrowRight, Eye } from "lucide-react";

import type { AdminWithdrawalRow } from "../../../types/wallet";
import { formatAdminDateTime, formatVnd, riskPresentation, statusPresentation } from "./withdrawalViewModel";

type ReviewHandler = (id: number, trigger: HTMLButtonElement) => void;

export function WithdrawalOperationsTable({
  rows,
  loading,
  total,
  page,
  totalPages,
  onPage,
  onReview,
}: {
  rows: AdminWithdrawalRow[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  onReview: ReviewHandler;
}) {
  return (
    <section aria-labelledby="withdrawal-queue-heading" className="border border-slate-200 bg-white shadow-sm">
      <div className="flex items-end justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b3193a]">Live queue</p>
          <h2 id="withdrawal-queue-heading" className="mt-1 text-xl font-black text-[#070f4f]">Withdrawal operations</h2>
        </div>
        <p role="status" aria-live="polite" className="text-sm font-bold tabular-nums text-slate-500">
          {loading ? "Loading…" : `${total} requests`}
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-[#f3f2ef] text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-5 py-3">Request / user</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => <WithdrawalRow key={row.id} row={row} onReview={onReview} />)}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 md:hidden">
        {rows.map((row) => <WithdrawalCard key={row.id} row={row} onReview={onReview} />)}
      </div>

      {!loading && rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-lg font-black text-slate-800">Queue is clear</p>
          <p className="mt-1 text-sm text-slate-500">No withdrawals match the current filters.</p>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} className="min-h-11 border border-slate-300 px-4 text-xs font-black uppercase tracking-wider disabled:opacity-40">Previous</button>
          <span className="text-xs font-bold text-slate-500">Page {page + 1} of {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)} className="min-h-11 border border-slate-300 px-4 text-xs font-black uppercase tracking-wider disabled:opacity-40">Next</button>
        </div>
      ) : null}
    </section>
  );
}

function Badges({ row, includeStatus = true }: { row: AdminWithdrawalRow; includeStatus?: boolean }) {
  const risk = riskPresentation[row.risk.level];
  const status = statusPresentation[row.status];
  return (
    <>
      <span className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${risk.className}`}>{risk.label}</span>
      {includeStatus ? <span className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${status.className}`}>{status.label}</span> : null}
    </>
  );
}

function Actions({ row, onReview }: { row: AdminWithdrawalRow; onReview: ReviewHandler }) {
  return (
    <div className="flex justify-end">
      <button type="button" aria-label={`Review withdrawal #${row.id}`} onClick={(event) => onReview(row.id, event.currentTarget)} className="inline-flex min-h-11 items-center gap-1.5 border border-slate-300 px-3 text-xs font-black text-slate-800 hover:border-[#070f4f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]">
        <Eye className="h-4 w-4" aria-hidden="true" /> Review <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function WithdrawalRow({ row, onReview }: { row: AdminWithdrawalRow; onReview: ReviewHandler }) {
  return (
    <tr className="align-middle hover:bg-[#fafaf8]">
      <td className="px-5 py-4"><p className="font-mono text-[11px] font-bold text-[#b3193a]">WD-{String(row.id).padStart(6, "0")}</p><p className="mt-1 font-black text-slate-950">{row.userName}</p><p className="text-xs text-slate-500">{row.userEmail}</p></td>
      <td className="px-4 py-4 font-black tabular-nums text-slate-950">{formatVnd(row.amount)}</td>
      <td className="px-4 py-4"><p className="font-bold text-slate-800">{row.bankName ?? row.bankCode ?? "Legacy"}</p><p className="font-mono text-xs text-slate-500">{row.maskedAccountNumber}</p></td>
      <td className="px-4 py-4"><Badges row={row} includeStatus={false} /></td>
      <td className="px-4 py-4"><span className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusPresentation[row.status].className}`}>{statusPresentation[row.status].label}</span></td>
      <td className="px-4 py-4 text-xs font-semibold text-slate-500">{formatAdminDateTime(row.requestedAt)}</td>
      <td className="px-5 py-4"><Actions row={row} onReview={onReview} /></td>
    </tr>
  );
}

function WithdrawalCard({ row, onReview }: { row: AdminWithdrawalRow; onReview: ReviewHandler }) {
  return (
    <article className="space-y-4 p-5" aria-label={`Withdrawal #${row.id}`}>
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[11px] font-bold text-[#b3193a]">WD-{String(row.id).padStart(6, "0")}</p><h3 className="mt-1 font-black text-slate-950">{row.userName}</h3></div><p className="font-black tabular-nums text-slate-950">{formatVnd(row.amount)}</p></div>
      <div className="flex flex-wrap gap-2"><Badges row={row} /></div>
      <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Destination</dt><dd className="mt-1 font-bold text-slate-700">{row.bankName}<br />{row.maskedAccountNumber}</dd></div><div><dt className="text-slate-400">Requested</dt><dd className="mt-1 font-bold text-slate-700">{formatAdminDateTime(row.requestedAt)}</dd></div></dl>
      <Actions row={row} onReview={onReview} />
    </article>
  );
}
