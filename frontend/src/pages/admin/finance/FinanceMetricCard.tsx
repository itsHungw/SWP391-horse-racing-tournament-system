import type { LucideIcon } from "lucide-react";

type FinanceMetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "negative";
};

const toneClass = {
  neutral: "text-[#070f4f] border-t-[#070f4f]",
  positive: "text-emerald-700 border-t-emerald-600",
  negative: "text-[#b3193a] border-t-[#b3193a]",
};

export function FinanceMetricCard({ label, value, detail, icon: Icon, tone = "neutral" }: FinanceMetricCardProps) {
  return (
    <article className={`overflow-hidden border border-slate-200 border-t-4 bg-white p-5 shadow-sm ${toneClass[tone]}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 text-[10px] font-black uppercase leading-5 tracking-[0.18em] text-slate-500">{label}</p>
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-current/20 bg-current/5">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 break-words font-mono text-[clamp(1.35rem,1.5vw,1.875rem)] font-black leading-tight tracking-tight tabular-nums">{value}</p>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </article>
  );
}
