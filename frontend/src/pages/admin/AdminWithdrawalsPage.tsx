import { FileSpreadsheet, Landmark, RefreshCw, ShieldCheck } from "lucide-react";
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
import { parseWithdrawalFilters, writeWithdrawalFilters } from "./withdrawals/withdrawalViewModel";

const EMPTY_PAGE: PageResponse<AdminWithdrawalRow> = {
  content: [], totalElements: 0, totalPages: 0, number: 0, size: 20,
};

function parseReviewId(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function AdminWithdrawalsPage() {
  useDocumentTitle("Withdrawal operations");
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseWithdrawalFilters(searchParams), [searchParams]);
  const [page, setPage] = useState<PageResponse<AdminWithdrawalRow>>(EMPTY_PAGE);
  const [summary, setSummary] = useState<AdminWithdrawalSummary | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const selectedId = useMemo(() => parseReviewId(searchParams.get("review")), [searchParams]);
  const [exportOpen, setExportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);
  const patchFilters = useCallback((patch: Partial<WithdrawalAdminFilters>) => {
    const next = writeWithdrawalFilters({ ...filters, ...patch });
    if (selectedId !== null) next.set("review", String(selectedId));
    setSearchParams(next);
  }, [filters, selectedId, setSearchParams]);
  const openReview = useCallback((id: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("review", String(id));
    setSearchParams(next);
  }, [searchParams, setSearchParams]);
  const closeReview = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("review");
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let current = true;
    setListLoading(true);
    setListError(null);
    adminWalletApi.listWithdrawals(filters)
      .then((result) => { if (current) setPage(result); })
      .catch(() => {
        if (current) {
          setPage(EMPTY_PAGE);
          setListError("The withdrawal queue could not be loaded.");
        }
      })
      .finally(() => { if (current) setListLoading(false); });
    return () => { current = false; };
  }, [filters, refreshKey]);

  useEffect(() => {
    let current = true;
    setSummaryLoading(true);
    adminWalletApi.getSummary()
      .then((result) => { if (current) setSummary(result); })
      .catch(() => { if (current) setSummary(null); })
      .finally(() => { if (current) setSummaryLoading(false); });
    return () => { current = false; };
  }, [refreshKey]);

  const exportFilters = useMemo(() => ({
    query: filters.query,
    status: filters.status,
    risk: filters.risk,
    from: filters.from,
    to: filters.to,
    sort: filters.sort,
  }), [filters.from, filters.query, filters.risk, filters.sort, filters.status]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1440px] space-y-5">
        <header className="relative overflow-hidden border border-[#070f4f] bg-[#070f4f] px-6 py-6 text-white shadow-sm sm:px-8">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-[#b3193a]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-rose-300">Finance control / settlement desk</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Withdrawal operations</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/75">Review, transfer and reconcile every payout from one focused workspace.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={refresh} className="inline-flex min-h-11 items-center gap-2 border border-white/25 px-4 text-xs font-black uppercase tracking-wider hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button>
              <button type="button" onClick={() => setExportOpen(true)} className="inline-flex min-h-11 items-center gap-2 bg-white px-4 text-xs font-black uppercase tracking-wider text-[#070f4f] hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Export Excel</button>
            </div>
          </div>
        </header>

        <WithdrawalSummaryCards summary={summary} loading={summaryLoading} onFilter={patchFilters} />
        <WithdrawalFilters filters={filters} onChange={patchFilters} />
        {listError ? <div role="alert" className="flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"><ShieldCheck className="h-5 w-5" aria-hidden="true" />{listError}</div> : null}
        <WithdrawalOperationsTable rows={page.content} loading={listLoading} total={page.totalElements} page={filters.page} totalPages={page.totalPages} onPage={(next) => patchFilters({ page: next })} onReview={openReview} />

        <footer className="flex flex-col gap-2 border-t border-slate-300 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2"><Landmark className="h-4 w-4" aria-hidden="true" /> Full account numbers appear only inside review and reconciliation export.</p>
          <p>All decisions are written to the immutable audit timeline.</p>
        </footer>
      </div>

      <WithdrawalReviewModal id={selectedId} onClose={closeReview} onUpdated={refresh} />
      <WithdrawalExportDialog open={exportOpen} filters={exportFilters} onClose={() => setExportOpen(false)} />
    </AdminLayout>
  );
}
