import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ReceiptText, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { adminFinanceApi } from "../../../api/adminFinanceApi";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { AdminLayout } from "../../../layouts/AdminLayout";
import type {
  AdminFinanceTransaction,
  AdminTopUpReconciliation,
  FinanceReconciliationIssue,
  FinanceTopUpFilters,
  PageResponse,
  TopUpStatus,
} from "../../../types/adminFinance";
import { defaultFinanceRange } from "../../../utils/financeDate";
import { FinanceFilters } from "./FinanceFilters";

const statuses = ["INITIATED", "PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;
const issueValues = new Set<FinanceReconciliationIssue>([
  "MISSING_WALLET_CREDIT", "AMOUNT_MISMATCH", "UNEXPECTED_WALLET_CREDIT", "ORPHAN_WALLET_CREDIT", "STALE_PENDING",
]);
const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const statusLabels: Record<AdminTopUpReconciliation["reconciliationStatus"], string> = {
  MATCHED: "Matched",
  MISSING_WALLET_CREDIT: "Missing wallet credit",
  AMOUNT_MISMATCH: "Amount mismatch",
  UNEXPECTED_WALLET_CREDIT: "Unexpected wallet credit",
  STALE_PENDING: "Stale pending",
  INITIATED: "Initiated",
  PENDING: "Pending",
  SUCCESS: "Success",
  FAILED: "Failed",
  EXPIRED: "Expired",
};
const issueLabels: Record<FinanceReconciliationIssue, string> = {
  MISSING_WALLET_CREDIT: "Missing wallet credit",
  AMOUNT_MISMATCH: "Amount mismatch",
  UNEXPECTED_WALLET_CREDIT: "Unexpected wallet credit",
  ORPHAN_WALLET_CREDIT: "Orphan wallet credit",
  STALE_PENDING: "Pending over 30 minutes",
};

function parseIssue(value: string | null): FinanceReconciliationIssue | undefined {
  return value && issueValues.has(value as FinanceReconciliationIssue)
    ? value as FinanceReconciliationIssue
    : undefined;
}

export function AdminFinanceTopUpsPage() {
  useDocumentTitle("Top-up reconciliation");
  const [params, setParams] = useSearchParams();
  const defaults = defaultFinanceRange();
  const filters: FinanceTopUpFilters = {
    from: params.get("from") ?? defaults.from,
    to: params.get("to") ?? defaults.to,
    query: params.get("query") ?? undefined,
    status: (params.get("status") as TopUpStatus | null) ?? undefined,
    reconciliationStatus: parseIssue(params.get("reconciliationStatus")),
    page: Number(params.get("page") ?? 0),
    size: 20,
  };
  const requestKey = JSON.stringify(filters);
  const orphanMode = filters.reconciliationStatus === "ORPHAN_WALLET_CREDIT";
  const [result, setResult] = useState<PageResponse<AdminTopUpReconciliation> | null>(null);
  const [orphanCredits, setOrphanCredits] = useState<PageResponse<AdminFinanceTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(false);
    setResult(null);
    setOrphanCredits(null);
    const request = orphanMode
      ? adminFinanceApi.listOrphanTopUpCredits({
          from: filters.from,
          to: filters.to,
          page: filters.page,
          size: filters.size,
        })
      : adminFinanceApi.listTopUps(filters);
    request
      .then((page) => {
        if (ignore) return;
        if (orphanMode) setOrphanCredits(page as PageResponse<AdminFinanceTransaction>);
        else setResult(page as PageResponse<AdminTopUpReconciliation>);
      })
      .catch(() => { if (!ignore) setError(true); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [requestKey, orphanMode]);

  const updateFilters = (values: { from: string; to: string; query: string; typeValue: string; minAmount: string; maxAmount: string }) => {
    setParams({
      from: values.from,
      to: values.to,
      ...(values.query ? { query: values.query } : {}),
      ...(values.typeValue ? { status: values.typeValue } : {}),
      ...(filters.reconciliationStatus ? { reconciliationStatus: filters.reconciliationStatus } : {}),
    });
  };

  const clearIssue = () => setParams((current) => {
    const next = new URLSearchParams(current);
    next.delete("reconciliationStatus");
    next.delete("page");
    return next;
  });

  return (
    <AdminLayout>
      <section className="space-y-5" aria-labelledby="topups-title">
        <header className="border-l-8 border-emerald-500 bg-[#070f4f] px-6 py-6 text-white"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Finance · VNPay</p><h1 className="mt-2 text-3xl font-black" id="topups-title">Top-up reconciliation</h1><p className="mt-2 max-w-2xl text-sm text-blue-100/75">Match payment-gateway orders to wallet credits without mutating the financial record.</p></header>
        <FinanceFilters from={filters.from} onApply={updateFilters} query={filters.query ?? ""} to={filters.to} typeLabel="Order status" typeOptions={statuses} typeValue={filters.status} />

        {filters.reconciliationStatus ? <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3"><p className="text-sm font-black text-amber-950">Showing issue: {issueLabels[filters.reconciliationStatus]}</p><button className="inline-flex min-h-11 items-center gap-2 px-3 text-xs font-black uppercase tracking-wider text-amber-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700" onClick={clearIssue} type="button"><X className="h-4 w-4" aria-hidden="true" />Clear issue</button></div> : null}
        {error ? <p className="border-l-4 border-[#b3193a] bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">Top-up reconciliation could not be loaded.</p> : null}

        {orphanMode ? (
          <OrphanCreditsSection
            loading={loading}
            page={orphanCredits}
            onPageChange={(page) => setParams((current) => {
              const next = new URLSearchParams(current);
              next.set("page", String(page));
              return next;
            })}
          />
        ) : (
          <section aria-busy={loading} aria-label="Top-up reconciliation results" className="border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">User</th><th className="px-4 py-3">VNPay reference</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Order status</th><th className="px-4 py-3">Reconciliation</th></tr></thead><tbody className="divide-y divide-slate-100">
              {loading ? <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={6}>Loading top-up orders…</td></tr> : result?.content.length ? result.content.map((row) => <TopUpRow key={row.id} row={row} />) : <tr><td className="px-4 py-12 text-center text-slate-500" colSpan={6}><ReceiptText className="mx-auto h-7 w-7" aria-hidden="true" /><p className="mt-3 font-semibold">No top-up orders match these filters.</p></td></tr>}
            </tbody></table></div>
            {result && result.totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><button className="min-h-11 px-4 font-bold disabled:opacity-40" disabled={filters.page === 0} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("page", String(filters.page - 1)); return next; })} type="button">Previous</button><p className="text-xs font-bold text-slate-500">Page {filters.page + 1} of {result.totalPages}</p><button className="min-h-11 px-4 font-bold disabled:opacity-40" disabled={filters.page + 1 >= result.totalPages} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("page", String(filters.page + 1)); return next; })} type="button">Next</button></div> : null}
          </section>
        )}
      </section>
    </AdminLayout>
  );
}

function TopUpRow({ row }: { row: AdminTopUpReconciliation }) {
  const issue = issueValues.has(row.reconciliationStatus as FinanceReconciliationIssue);
  const Icon = row.reconciliationStatus === "MATCHED" ? CheckCircle2 : issue ? AlertTriangle : Clock3;
  return <tr className="hover:bg-slate-50"><td className="px-4 py-4"><p className="font-mono font-black text-[#070f4f]">#{row.id}</p><p className="mt-1 text-xs text-slate-500">{new Date(row.createdAt).toLocaleString("vi-VN")}</p></td><td className="px-4 py-4"><p className="font-black text-slate-900">{row.userName}</p><p className="text-xs text-slate-500">{row.userEmail}</p></td><td className="px-4 py-4"><p className="font-mono font-bold">{row.vnpayTxnRef}</p><p className="mt-1 text-xs text-slate-500">{row.vnpayTransactionNo ?? "No gateway transaction number"}</p></td><td className="px-4 py-4 text-right font-mono font-black text-emerald-700 tabular-nums">+{vnd.format(row.amount)}</td><td className="px-4 py-4"><span className="border border-slate-300 px-2 py-1 text-xs font-black">{row.status}</span></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-2 text-xs font-black ${row.reconciliationStatus === "MATCHED" ? "text-emerald-700" : issue ? "text-[#b3193a]" : "text-amber-700"}`}><Icon className="h-4 w-4" aria-hidden="true" />{statusLabels[row.reconciliationStatus]}</span></td></tr>;
}

function OrphanCreditsSection({ loading, page, onPageChange }: { loading: boolean; page: PageResponse<AdminFinanceTransaction> | null; onPageChange: (page: number) => void }) {
  const rows = page?.content ?? [];
  return <section aria-busy={loading} aria-labelledby="orphan-credits-title" className="border border-red-200 bg-white shadow-sm"><div className="border-l-4 border-[#b3193a] bg-red-50 p-4"><h2 className="font-black text-red-950" id="orphan-credits-title">Orphan wallet credits</h2><p className="mt-1 text-sm text-red-800">TOPUP ledger entries with no matching TopUpOrder require manual investigation.</p></div>{loading ? <p className="p-10 text-center text-sm font-semibold text-slate-500">Loading orphan credits…</p> : rows.length ? <ul className="divide-y divide-slate-200">{rows.map((credit) => <li className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm" key={credit.id}><span><span className="block font-mono font-black text-[#070f4f]">Transaction #{credit.id}</span><span className="mt-1 block text-xs text-slate-500">{credit.userEmail} · {new Date(credit.createdAt).toLocaleString("vi-VN")}</span></span><span className="font-mono font-black text-emerald-700">+{vnd.format(credit.amount)}</span></li>)}</ul> : <p className="p-10 text-center text-sm font-semibold text-slate-500">No orphan wallet credits in this period.</p>}{page && page.totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><button className="min-h-11 px-4 font-bold disabled:opacity-40" disabled={page.number === 0} onClick={() => onPageChange(page.number - 1)} type="button">Previous</button><p className="text-xs font-bold text-slate-500">Page {page.number + 1} of {page.totalPages}</p><button className="min-h-11 px-4 font-bold disabled:opacity-40" disabled={page.number + 1 >= page.totalPages} onClick={() => onPageChange(page.number + 1)} type="button">Next</button></div> : null}</section>;
}
