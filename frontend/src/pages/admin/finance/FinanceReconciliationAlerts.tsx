import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import type {
  AdminFinanceReconciliationSummary,
  FinanceRange,
  FinanceReconciliationIssue,
} from "../../../types/adminFinance";

type AlertDefinition = {
  key: keyof AdminFinanceReconciliationSummary;
  issue: FinanceReconciliationIssue;
  label: string;
  reviewLabel: (count: number) => string;
  detail: string;
};

const alertDefinitions: AlertDefinition[] = [
  { key: "missingWalletCredits", issue: "MISSING_WALLET_CREDIT", label: "Missing wallet credit", reviewLabel: (count) => `Review ${count} missing wallet credits`, detail: "Gateway success has no matching wallet entry." },
  { key: "amountMismatches", issue: "AMOUNT_MISMATCH", label: "Amount mismatch", reviewLabel: (count) => `Review ${count} amount mismatches`, detail: "Order and credited wallet amounts differ." },
  { key: "unexpectedWalletCredits", issue: "UNEXPECTED_WALLET_CREDIT", label: "Unexpected wallet credit", reviewLabel: (count) => `Review ${count} unexpected wallet credits`, detail: "A non-successful order has a wallet credit." },
  { key: "orphanWalletCredits", issue: "ORPHAN_WALLET_CREDIT", label: "Orphan wallet credit", reviewLabel: (count) => `Review ${count} orphan wallet credits`, detail: "A TOPUP entry has no matching gateway order." },
  { key: "stalePendingOrders", issue: "STALE_PENDING", label: "Pending over 30 minutes", reviewLabel: (count) => `Review ${count} stale pending orders`, detail: "Payment state has not resolved within the expected window." },
];

export function FinanceReconciliationAlerts({ data, range }: { data: AdminFinanceReconciliationSummary; range: FinanceRange }) {
  const activeAlerts = alertDefinitions.filter(({ key }) => data[key] > 0);

  return (
    <section aria-labelledby="reconciliation-alerts-title" className="border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b3193a]">Exception queue</p>
          <h2 className="mt-1 text-xl font-black text-[#070f4f]" id="reconciliation-alerts-title">Reconciliation alerts</h2>
        </div>
        <p className="text-xs font-semibold text-slate-500">Only cases that need investigation appear here.</p>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="flex items-center gap-3 p-5 text-emerald-800" role="status">
          <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
          <div><p className="font-black">No reconciliation exceptions in this period</p><p className="mt-1 text-sm text-emerald-700">All checked top-up records are internally consistent.</p></div>
        </div>
      ) : (
        <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-y-0">
          {activeAlerts.map((alert, index) => {
            const count = data[alert.key];
            const search = new URLSearchParams({
              from: range.from,
              to: range.to,
              reconciliationStatus: alert.issue,
            });
            return (
              <Link
                aria-label={alert.reviewLabel(count)}
                className={`group flex min-h-28 items-center gap-4 px-5 py-4 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b3193a] ${index % 2 === 0 ? "lg:border-r lg:border-slate-200" : ""}`}
                key={alert.issue}
                to={`/admin/finance/topups?${search.toString()}`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center border border-red-200 bg-red-50 text-[#b3193a]"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">{alert.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{alert.detail}</span></span>
                <span className="font-mono text-2xl font-black tabular-nums text-[#b3193a]">{count}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#b3193a] motion-reduce:transform-none" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
