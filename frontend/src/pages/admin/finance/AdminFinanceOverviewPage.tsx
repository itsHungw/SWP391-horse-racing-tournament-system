import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, Scale, WalletCards } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { adminFinanceApi } from "../../../api/adminFinanceApi";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { AdminLayout } from "../../../layouts/AdminLayout";
import type {
  AdminFinanceReconciliationSummary,
  AdminFinanceSummary,
  AdminFinanceTransaction,
  FinanceRange,
  PageResponse,
} from "../../../types/adminFinance";
import { defaultFinanceRange } from "../../../utils/financeDate";
import { FinanceMetricCard } from "./FinanceMetricCard";
import { FinanceRecentTransactions } from "./FinanceRecentTransactions";
import { FinanceReconciliationAlerts } from "./FinanceReconciliationAlerts";
import { TransactionDetailPanel } from "./TransactionDetailPanel";

type RequestState<T> = { data: T | null; loading: boolean; error: boolean };
const loadingState = <T,>(): RequestState<T> => ({ data: null, loading: true, error: false });
const failedState = <T,>(): RequestState<T> => ({ data: null, loading: false, error: true });
const dayOptions = [7, 30, 90] as const;
const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function resolveRange(days: number): FinanceRange {
  return defaultFinanceRange(days);
}

export function AdminFinanceOverviewPage() {
  useDocumentTitle("Finance overview");
  const [params, setParams] = useSearchParams();
  const selectedDays = Number(params.get("days"));
  const days = dayOptions.includes(selectedDays as (typeof dayOptions)[number]) ? selectedDays : 30;
  const range = resolveRange(days);
  const [summary, setSummary] = useState<RequestState<AdminFinanceSummary>>(loadingState);
  const [alerts, setAlerts] = useState<RequestState<AdminFinanceReconciliationSummary>>(loadingState);
  const [transactions, setTransactions] = useState<RequestState<PageResponse<AdminFinanceTransaction>>>(loadingState);
  const [summaryRetry, setSummaryRetry] = useState(0);
  const [alertsRetry, setAlertsRetry] = useState(0);
  const [transactionsRetry, setTransactionsRetry] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminFinanceTransaction | null>(null);
  const [detailError, setDetailError] = useState(false);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let ignore = false;
    setSummary(loadingState());
    adminFinanceApi.getSummary(range)
      .then((data) => { if (!ignore) setSummary({ data, loading: false, error: false }); })
      .catch(() => { if (!ignore) setSummary(failedState()); });
    return () => { ignore = true; };
  }, [range.from, range.to, summaryRetry]);

  useEffect(() => {
    let ignore = false;
    setAlerts(loadingState());
    adminFinanceApi.getReconciliationSummary(range)
      .then((data) => { if (!ignore) setAlerts({ data, loading: false, error: false }); })
      .catch(() => { if (!ignore) setAlerts(failedState()); });
    return () => { ignore = true; };
  }, [range.from, range.to, alertsRetry]);

  useEffect(() => {
    let ignore = false;
    setTransactions(loadingState());
    adminFinanceApi.listTransactions({ ...range, page: 0, size: 8 })
      .then((data) => { if (!ignore) setTransactions({ data, loading: false, error: false }); })
      .catch(() => { if (!ignore) setTransactions(failedState()); });
    return () => { ignore = true; };
  }, [range.from, range.to, transactionsRetry]);

  const closeDetail = useCallback(() => {
    setSelectedTransaction(null);
    requestAnimationFrame(() => detailTrigger.current?.focus());
  }, []);

  const openDetail = (transaction: AdminFinanceTransaction, trigger: HTMLButtonElement) => {
    detailTrigger.current = trigger;
    setDetailError(false);
    adminFinanceApi.getTransaction(transaction.id)
      .then(setSelectedTransaction)
      .catch(() => setDetailError(true));
  };

  const signed = (value: number) => `${value >= 0 ? "+" : ""}${vnd.format(value)}`;

  return (
    <AdminLayout>
      <section className="space-y-6" aria-labelledby="finance-title">
        <header className="relative overflow-hidden border-l-8 border-[#b3193a] bg-[#070f4f] px-6 py-7 text-white shadow-sm">
          <div className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-300">Finance operations desk</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" id="finance-title">Finance overview</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75">Cash health and immutable evidence for fast incident reconciliation. Prediction operations remain in Prediction Admin.</p></div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Finance reporting period">
              {dayOptions.map((option) => <button aria-pressed={days === option} className={`min-h-11 border px-4 text-xs font-black uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${days === option ? "border-white bg-white text-[#070f4f]" : "border-white/25 text-white hover:bg-white/10"}`} key={option} onClick={() => setParams({ days: String(option) })} type="button">{option} days</button>)}
            </div>
          </div>
          <p className="relative mt-5 border-t border-white/10 pt-4 text-xs font-semibold text-blue-100/65">Reporting window: {range.from} to {range.to} · Wallet liability is current as of now.</p>
        </header>

        {summary.loading ? <div aria-busy="true" aria-label="Loading finance metrics" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">{dayOptions.map((item) => <div className="h-40 animate-pulse bg-slate-200 motion-reduce:animate-none" key={item} />)}<div className="h-40 animate-pulse bg-slate-200 motion-reduce:animate-none" /><div className="h-40 animate-pulse bg-slate-200 motion-reduce:animate-none" /></div> : null}
        {summary.error ? <SectionError label="Finance metrics could not be loaded." onRetry={() => setSummaryRetry((value) => value + 1)} retryLabel="Retry finance metrics" /> : null}
        {summary.data ? <div aria-label="Finance health metrics" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4"><FinanceMetricCard detail="Gross prediction revenue, not net profit" icon={Activity} label="Gross gaming revenue" tone={summary.data.ggr < 0 ? "negative" : "positive"} value={signed(summary.data.ggr)} /><FinanceMetricCard detail="Successful VNPay money-in" icon={ArrowDownToLine} label="Successful top-ups" tone="positive" value={`+${vnd.format(summary.data.successfulTopUps)}`} /><FinanceMetricCard detail="Completed external money-out" icon={ArrowUpFromLine} label="Paid withdrawals" tone="negative" value={`−${vnd.format(summary.data.paidWithdrawals)}`} /><FinanceMetricCard detail="Top-ups minus paid withdrawals" icon={WalletCards} label="Net cash movement" tone={summary.data.netCashMovement < 0 ? "negative" : "positive"} value={signed(summary.data.netCashMovement)} /><FinanceMetricCard detail="Current funds owed across user wallets" icon={Scale} label="Wallet liability" value={vnd.format(summary.data.walletLiability)} /></div> : null}

        {alerts.loading ? <div aria-busy="true" aria-label="Loading reconciliation alerts" className="h-48 animate-pulse bg-slate-200 motion-reduce:animate-none" /> : null}
        {alerts.error ? <SectionError label="Reconciliation alerts could not be loaded." onRetry={() => setAlertsRetry((value) => value + 1)} retryLabel="Retry reconciliation alerts" /> : null}
        {alerts.data ? <FinanceReconciliationAlerts data={alerts.data} range={range} /> : null}

        {detailError ? <p className="border-l-4 border-[#b3193a] bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">Transaction details could not be loaded.</p> : null}
        {transactions.loading ? <div aria-busy="true" aria-label="Loading recent transactions" className="h-64 animate-pulse bg-slate-200 motion-reduce:animate-none" /> : null}
        {transactions.error ? <SectionError label="Recent transactions could not be loaded." onRetry={() => setTransactionsRetry((value) => value + 1)} retryLabel="Retry recent transactions" /> : null}
        {transactions.data ? <FinanceRecentTransactions onSelect={openDetail} range={range} rows={transactions.data.content} /> : null}
      </section>
      {selectedTransaction ? <TransactionDetailPanel onClose={closeDetail} transaction={selectedTransaction} /> : null}
    </AdminLayout>
  );
}

function SectionError({ label, retryLabel, onRetry }: { label: string; retryLabel: string; onRetry: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-[#b3193a] bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert"><span>{label}</span><button className="min-h-11 border border-red-300 bg-white px-4 text-xs font-black uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b3193a]" onClick={onRetry} type="button">{retryLabel}</button></div>;
}
