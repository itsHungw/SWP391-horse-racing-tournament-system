import { FileSpreadsheet, Landmark, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminWalletApi } from "../../api/adminWalletApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";
import type { AdminWithdrawalRow, AdminWithdrawalSummary, PageResponse, WithdrawalAdminFilters } from "../../types/wallet";
import { WithdrawalExportDialog } from "./withdrawals/WithdrawalExportDialog";
import { WithdrawalFilters } from "./withdrawals/WithdrawalFilters";
import { WithdrawalOperationsTable } from "./withdrawals/WithdrawalOperationsTable";
import { WithdrawalReviewModal } from "./withdrawals/WithdrawalReviewModal";
import { WithdrawalSummaryCards } from "./withdrawals/WithdrawalSummaryCards";
import { formatVnd, parseWithdrawalFilters, writeWithdrawalFilters } from "./withdrawals/withdrawalViewModel";

const EMPTY_PAGE: PageResponse<AdminWithdrawalRow> = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };

export function AdminWithdrawalsPage() {
  useDocumentTitle("Withdrawal operations");
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseWithdrawalFilters(searchParams), [searchParams]);
  const [page, setPage] = useState<PageResponse<AdminWithdrawalRow>>(EMPTY_PAGE);
  const [summary, setSummary] = useState<AdminWithdrawalSummary | null>(null);
  const [listLoading, setListLoading] = useState(true); const [summaryLoading, setSummaryLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null); const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quickRow, setQuickRow] = useState<AdminWithdrawalRow | null>(null); const [quickBusy, setQuickBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false); const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);
  const patchFilters = useCallback((patch: Partial<WithdrawalAdminFilters>) => {
    setSearchParams(writeWithdrawalFilters({ ...filters, ...patch }));
  }, [filters, setSearchParams]);

  useEffect(() => { let current = true; setListLoading(true); setListError(null); adminWalletApi.listWithdrawals(filters).then((result) => { if (current) setPage(result); }).catch(() => { if (current) { setPage(EMPTY_PAGE); setListError("The withdrawal queue could not be loaded."); } }).finally(() => { if (current) setListLoading(false); }); return () => { current = false; }; }, [filters, refreshKey]);
  useEffect(() => { let current = true; setSummaryLoading(true); adminWalletApi.getSummary().then((result) => { if (current) setSummary(result); }).catch(() => { if (current) setSummary(null); }).finally(() => { if (current) setSummaryLoading(false); }); return () => { current = false; }; }, [refreshKey]);

  const exportFilters = useMemo(() => ({ query: filters.query, status: filters.status, risk: filters.risk, from: filters.from, to: filters.to, sort: filters.sort }), [filters.from, filters.query, filters.risk, filters.sort, filters.status]);

  async function quickApprove() {
    if (!quickRow) return; setQuickBusy(true); setListError(null);
    try { await adminWalletApi.approve(quickRow.id, { riskAcknowledged: false, internalNote: "" }); setQuickRow(null); refresh(); }
    catch { setQuickRow(null); setSelectedId(quickRow.id); setListError("Quick approval needs a full review. The request has been opened."); }
    finally { setQuickBusy(false); }
  }

  return <AdminLayout><div className="mx-auto max-w-[1440px] space-y-5">
    <header className="relative overflow-hidden border border-[#070f4f] bg-[#070f4f] px-6 py-6 text-white shadow-sm sm:px-8"><div className="absolute right-0 top-0 h-full w-1.5 bg-[#b3193a]" /><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-rose-300">Finance control / settlement desk</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Withdrawal operations</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/75">A decision workspace for reviewing evidence, approving payouts and reconciling bank transfers without exposing account details in the daily queue.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={refresh} className="inline-flex min-h-11 items-center gap-2 border border-white/25 px-4 text-xs font-black uppercase tracking-wider hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><RefreshCw className="h-4 w-4" /> Refresh</button><button type="button" onClick={() => setExportOpen(true)} className="inline-flex min-h-11 items-center gap-2 bg-white px-4 text-xs font-black uppercase tracking-wider text-[#070f4f] hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><FileSpreadsheet className="h-4 w-4" /> Export Excel</button></div></div></header>
    <WithdrawalSummaryCards summary={summary} loading={summaryLoading} onFilter={patchFilters} />
    <WithdrawalFilters filters={filters} onChange={patchFilters} />
    {listError ? <div role="alert" className="flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"><ShieldCheck className="h-5 w-5" />{listError}</div> : null}
    <WithdrawalOperationsTable rows={page.content} loading={listLoading} total={page.totalElements} page={filters.page} totalPages={page.totalPages} onPage={(next) => patchFilters({ page: next })} onReview={(id) => setSelectedId(id)} onQuickApprove={setQuickRow} />
    <footer className="flex flex-col gap-2 border-t border-slate-300 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Full account numbers appear only inside review and reconciliation export.</p><p>All decisions are written to the immutable audit timeline.</p></footer>
  </div>
  <WithdrawalReviewModal id={selectedId} onClose={() => setSelectedId(null)} onUpdated={refresh} />
  <WithdrawalExportDialog open={exportOpen} filters={exportFilters} onClose={() => setExportOpen(false)} />
  {quickRow ? <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/60 p-4"><div role="dialog" aria-modal="true" aria-label={`Quick approve withdrawal #${quickRow.id}`} className="w-full max-w-md border-t-4 border-[#070f4f] bg-white p-6 shadow-2xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b3193a]">Low-risk shortcut</p><h2 className="mt-2 text-xl font-black text-[#070f4f]">Approve {formatVnd(quickRow.amount)}?</h2><p className="mt-2 text-sm text-slate-600">Destination: {quickRow.bankName} · {quickRow.maskedAccountNumber}</p><p className="mt-3 text-xs text-slate-500">Risk is recalculated by the server before approval.</p><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={quickBusy} onClick={() => setQuickRow(null)} className="min-h-11 border border-slate-300 px-4 text-sm font-black">Cancel</button><button type="button" disabled={quickBusy} onClick={() => void quickApprove()} className="inline-flex min-h-11 items-center gap-2 bg-[#070f4f] px-4 text-sm font-black text-white disabled:opacity-50">{quickBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Confirm approval</button></div></div></div> : null}
  </AdminLayout>;
}
