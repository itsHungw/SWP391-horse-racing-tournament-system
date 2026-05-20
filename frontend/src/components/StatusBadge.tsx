import type { PropsWithChildren } from "react";

type StatusBadgeProps = PropsWithChildren<{
  tone: "ready" | "draft";
}>;

const toneClasses = {
  ready: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  draft: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
