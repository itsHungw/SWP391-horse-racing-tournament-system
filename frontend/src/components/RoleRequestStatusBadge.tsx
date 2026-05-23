import { RoleRequest } from "../types/adminRoleRequest";

type Props = {
  status: RoleRequest["status"];
};

export function RoleRequestStatusBadge({ status }: Props) {
  const statusConfig: Record<
    RoleRequest["status"],
    { bg: string; text: string; ring: string; label: string }
  > = {
    PENDING: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      ring: "ring-amber-600/20",
      label: "Pending",
    },
    APPROVED: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      ring: "ring-emerald-600/20",
      label: "Approved",
    },
    REJECTED: {
      bg: "bg-rose-50",
      text: "text-rose-800",
      ring: "ring-rose-600/20",
      label: "Rejected",
    },
    CANCELLED: {
      bg: "bg-slate-50",
      text: "text-slate-800",
      ring: "ring-slate-600/20",
      label: "Cancelled",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-black ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}
    >
      {config.label}
    </span>
  );
}
