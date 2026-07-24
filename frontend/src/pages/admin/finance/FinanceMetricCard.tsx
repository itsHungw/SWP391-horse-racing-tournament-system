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
    <article className={`border border-slate-200 border-t-4 bg-white p-5 shadow-sm ${toneClass[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 font-mono text-3xl font-black tracking-tight tabular-nums">{value}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-current/20 bg-current/5">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </article>
  );
}
