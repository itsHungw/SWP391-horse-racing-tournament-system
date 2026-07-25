import { useEffect, useRef, useState } from "react";
import { Download, Eye, FileSearch } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { adminFinanceApi } from "../../../api/adminFinanceApi";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { AdminLayout } from "../../../layouts/AdminLayout";
import type { AdminFinanceTransaction, FinanceTransactionFilters, PageResponse, WalletTransactionType } from "../../../types/adminFinance";
import { FinanceFilters } from "./FinanceFilters";
import { TransactionDetailPanel } from "./TransactionDetailPanel";
import { defaultFinanceRange } from "../../../utils/financeDate";

const transactionTypes = ["TOPUP", "BET_PLACED", "BET_PAYOUT", "BET_REFUND", "WITHDRAWAL_HOLD", "WITHDRAWAL_REFUND", "ADMIN_ADJUSTMENT"] as const;
const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function AdminFinanceTransactionsPage() {
  useDocumentTitle("Finance transaction ledger");
  const [params, setParams] = useSearchParams();
  const defaults = defaultFinanceRange();
  const filters: FinanceTransactionFilters = {
    from: params.get("from") ?? defaults.from,
    to: params.get("to") ?? defaults.to,
    query: params.get("query") ?? undefined,
    type: (params.get("type") as WalletTransactionType | null) ?? undefined,
    referenceType: params.get("referenceType") ?? undefined,
    referenceId: params.get("referenceId") ? Number(params.get("referenceId")) : undefined,
    userId: params.get("userId") ? Number(params.get("userId")) : undefined,
    minAmount: params.get("minAmount") ? Number(params.get("minAmount")) : undefined,
    maxAmount: params.get("maxAmount") ? Number(params.get("maxAmount")) : undefined,
    page: Number(params.get("page") ?? 0),
    size: 20,
  };
  const requestKey = JSON.stringify(filters);
  const [result, setResult] = useState<PageResponse<AdminFinanceTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<AdminFinanceTransaction | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true); setError(false);
    adminFinanceApi.listTransactions(filters).then((data) => { if (!ignore) setResult(data); }).catch(() => { if (!ignore) setError(true); }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [requestKey]);

  const updateFilters = (values: { from: string; to: string; query: string; typeValue: string; minAmount: string; maxAmount: string }) => setParams({ from: values.from, to: values.to, ...(values.query ? { query: values.query } : {}), ...(values.typeValue ? { type: values.typeValue } : {}), ...(values.minAmount ? { minAmount: values.minAmount } : {}), ...(values.maxAmount ? { maxAmount: values.maxAmount } : {}) });
  const openDetail = async (id: number, trigger: HTMLButtonElement) => { lastTrigger.current = trigger; setDetail(await adminFinanceApi.getTransaction(id)); };
  const closeDetail = () => { setDetail(null); queueMicrotask(() => lastTrigger.current?.focus()); };
  const exportCsv = async () => {
    setExporting(true); setExportError(false);
    try {
      const download = await adminFinanceApi.exportTransactions(filters);
      const url = URL.createObjectURL(download.blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = download.filename; anchor.click(); URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <section className="space-y-5" aria-labelledby="ledger-title">
        <header className="border-l-8 border-[#b3193a] bg-[#070f4f] px-6 py-6 text-white"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">Finance · Reconciliation</p><h1 className="mt-2 text-3xl font-black" id="ledger-title">Transaction ledger</h1><p className="mt-2 max-w-2xl text-sm text-blue-100/75">Search immutable wallet movements and reconstruct balances for dispute evidence.</p></header>
        <FinanceFilters from={filters.from} minAmount={filters.minAmount?.toString()} maxAmount={filters.maxAmount?.toString()} onApply={updateFilters} query={filters.query ?? ""} showAmountRange to={filters.to} typeLabel="Transaction type" typeOptions={transactionTypes} typeValue={filters.type} />
        <div className="flex flex-wrap items-center justify-end gap-3">{exportError ? <p className="text-sm font-semibold text-[#b3193a]" role="alert">Export failed. Narrow the filters if the result exceeds 10,000 rows.</p> : null}<button className="inline-flex min-h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:border-[#070f4f] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]" disabled={exporting} onClick={exportCsv} type="button"><Download className="h-4 w-4" aria-hidden="true" />{exporting ? "Preparing CSV…" : "Export filtered CSV"}</button></div>
        {error ? <p className="border-l-4 border-[#b3193a] bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">Transactions could not be loaded.</p> : null}
        <section className="border border-slate-200 bg-white shadow-sm" aria-label="Wallet transaction results" aria-busy={loading}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-4 py-3">Time / ID</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Type / reference</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Balance after</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={6}>Loading ledger…</td></tr> : result?.content.length ? result.content.map((row) => <tr className="hover:bg-slate-50" key={row.id}><td className="px-4 py-4"><p className="font-mono font-black text-[#070f4f]">#{row.id}</p><p className="mt-1 text-xs text-slate-500">{new Date(row.createdAt).toLocaleString("vi-VN")}</p></td><td className="px-4 py-4"><p className="font-black text-slate-900">{row.userName}</p><p className="text-xs text-slate-500">{row.userEmail}</p></td><td className="px-4 py-4"><p className="font-black text-slate-800">{row.transactionType.replaceAll("_", " ")}</p><p className="mt-1 font-mono text-xs text-slate-500">{row.referenceType ?? "—"}{row.referenceId == null ? "" : ` #${row.referenceId}`}</p></td><td className={`px-4 py-4 text-right font-mono font-black tabular-nums ${row.amount >= 0 ? "text-emerald-700" : "text-[#b3193a]"}`}>{row.amount >= 0 ? "+" : ""}{vnd.format(row.amount)}</td><td className="px-4 py-4 text-right font-mono tabular-nums">{row.balanceAfter == null ? "—" : vnd.format(row.balanceAfter)}</td><td className="px-4 py-4 text-right"><button aria-label={`View transaction ${row.id}`} className="inline-grid h-11 w-11 place-items-center border border-slate-300 text-[#070f4f] hover:border-[#070f4f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]" onClick={(event) => openDetail(row.id, event.currentTarget)} type="button"><Eye className="h-4 w-4" aria-hidden="true" /></button></td></tr>) : <tr><td className="px-4 py-12 text-center text-slate-500" colSpan={6}><FileSearch className="mx-auto h-7 w-7" aria-hidden="true" /><p className="mt-3 font-semibold">No transactions match these filters.</p></td></tr>}
              </tbody>
            </table>
          </div>
          {result && result.totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><button className="min-h-11 px-4 font-bold disabled:opacity-40" disabled={filters.page === 0} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("page", String(filters.page - 1)); return next; })} type="button">Previous</button><p className="text-xs font-bold text-slate-500">Page {filters.page + 1} of {result.totalPages}</p><button className="min-h-11 px-4 font-bold disabled:opacity-40" disabled={filters.page + 1 >= result.totalPages} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("page", String(filters.page + 1)); return next; })} type="button">Next</button></div> : null}
        </section>
        {detail ? <TransactionDetailPanel onClose={closeDetail} transaction={detail} /> : null}
      </section>
    </AdminLayout>
  );
}
