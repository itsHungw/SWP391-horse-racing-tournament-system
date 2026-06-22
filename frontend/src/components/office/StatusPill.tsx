import type { ReactNode } from "react";

export type StatusTone =
  | "amber"
  | "emerald"
  | "rose"
  | "sky"
  | "indigo"
  | "brass"
  | "charcoal"
  | "neutral";

const TONE_CLASS: Record<StatusTone, string> = {
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-800",
  indigo: "bg-indigo-100 text-indigo-800",
  brass: "bg-office-sand text-office-gilt",
  charcoal: "bg-office-charcoal text-office-brass-bright",
  neutral: "bg-office-line-soft text-office-muted",
};

/**
 * Single source of truth for status → colour tone across the workspace, replacing the
 * per-page `statusBadge` / `contractBadge` / `raceBadge` record maps. Status is never
 * conveyed by colour alone — the label always rides along (PRODUCT.md a11y).
 */
const STATUS_TONE: Record<string, StatusTone> = {
  // Lifecycle / shared
  PENDING: "amber",
  APPROVED: "emerald",
  APPROVED_FOR_POOL: "emerald",
  ACTIVE: "emerald",
  OPEN_REGISTRATION: "emerald",
  REJECTED: "rose",
  DECLINED: "rose",
  CANCELLED: "rose",
  DISQUALIFIED: "rose",
  POSTPONED: "rose",
  WITHDRAWN: "neutral",
  TERMINATED: "neutral",
  DRAFT: "neutral",
  COMPLETED: "neutral",
  // Tournament gating
  PENDING_APPROVAL: "amber",
  CLOSED_REGISTRATION: "amber",
  PARTICIPANTS_LOCKED: "amber",
  SCHEDULE_PUBLISHED: "sky",
  ONGOING: "charcoal",
  // Race day
  SCHEDULED: "brass",
  CHECKING: "sky",
  READY: "sky",
  FINISHED: "indigo",
  RESULT_SUBMITTED: "indigo",
  RESULT_CONFIRMED: "emerald",
  PUBLISHED: "emerald",
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? "neutral";
}

export function prettyStatus(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusPill({
  status,
  tone,
  label,
  className = "",
}: {
  status: string;
  tone?: StatusTone;
  label?: ReactNode;
  className?: string;
}) {
  const resolved = tone ?? statusTone(status);
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${TONE_CLASS[resolved]} ${className}`}
    >
      {label ?? prettyStatus(status)}
    </span>
  );
}
