import type { ComponentType, ReactNode } from "react";

/**
 * Workspace empty state — dashed parchment panel with a display-serif headline. Teaches the
 * next action rather than stating "nothing here" (PRODUCT.md: empty states teach the interface).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-office-line-strong bg-white/60 px-8 py-16 text-center ${className}`}
    >
      {Icon && <Icon className="mx-auto h-7 w-7 text-office-faint" />}
      <p className={`font-display text-2xl font-light text-office-ink ${Icon ? "mt-3" : ""}`}>{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-office-muted">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
