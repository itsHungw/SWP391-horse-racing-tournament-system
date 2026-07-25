import { AlertTriangle, BanknoteArrowDown, CircleDollarSign, ShieldAlert } from "lucide-react";
import type { AdminWithdrawalSummary, WithdrawalAdminFilters } from "../../../types/wallet";
import { formatVnd } from "./withdrawalViewModel";

export function WithdrawalSummaryCards({
  summary,
  loading,
  onFilter,
}: {
  summary: AdminWithdrawalSummary | null;
  loading: boolean;
  onFilter: (patch: Partial<WithdrawalAdminFilters>) => void;
}) {
  const cards = [
    { label: "Needs review", value: summary?.needsReview ?? 0, icon: BanknoteArrowDown, patch: { status: "REQUESTED" as const }, accent: "#b3193a" },
    { label: "Ready to pay", value: summary?.readyToPay ?? 0, icon: CircleDollarSign, patch: { status: "APPROVED" as const }, accent: "#070f4f" },
    { label: "Pending value", value: formatVnd(summary?.pendingValue ?? 0), icon: AlertTriangle, accent: "#8a5b12" },
    { label: "High risk", value: summary?.highRisk ?? 0, icon: ShieldAlert, patch: { risk: "HIGH" as const }, accent: "#9f1239" },
  ];
  return (
    <section aria-label="Withdrawal operations summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const content = (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white" style={{ color: card.accent }}>
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{card.label}</span>
              <span className="mt-1 block truncate text-2xl font-black tabular-nums text-slate-950">{loading ? "—" : card.value}</span>
            </span>
          </>
        );
        return card.patch ? (
          <button key={card.label} type="button" onClick={() => onFilter({ ...card.patch, page: 0 })} className="flex min-h-24 items-center gap-4 border border-slate-200 bg-[#fbfbfa] p-4 text-left shadow-[0_1px_0_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] motion-reduce:transform-none">
            {content}
          </button>
        ) : (
          <div key={card.label} className="flex min-h-24 items-center gap-4 border border-slate-200 bg-[#fbfbfa] p-4 shadow-[0_1px_0_rgba(15,23,42,.04)]">{content}</div>
        );
      })}
    </section>
  );
}
