import type {
  WithdrawalAdminFilters,
  WithdrawalRiskLevel,
  WithdrawalSort,
  WithdrawalStatus,
} from "../../../types/wallet";

const statuses = new Set<WithdrawalStatus>(["REQUESTED", "APPROVED", "REJECTED", "PAID", "CANCELLED"]);
const risks = new Set<WithdrawalRiskLevel>(["LOW", "MEDIUM", "HIGH"]);
const sorts = new Set<WithdrawalSort>(["newest", "oldest", "amount_desc", "risk_desc"]);

export function parseWithdrawalFilters(params: URLSearchParams): WithdrawalAdminFilters {
  const status = params.get("status") as WithdrawalStatus | null;
  const risk = params.get("risk") as WithdrawalRiskLevel | null;
  const sort = params.get("sort") as WithdrawalSort | null;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const size = Math.min(100, Math.max(10, Number(params.get("size")) || 20));
  return {
    query: params.get("query")?.trim() || undefined,
    status: status && statuses.has(status) ? status : undefined,
    risk: risk && risks.has(risk) ? risk : undefined,
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    sort: sort && sorts.has(sort) ? sort : "newest",
    page: page - 1,
    size,
  };
}

export function writeWithdrawalFilters(filters: WithdrawalAdminFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.risk) params.set("risk", filters.risk);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 0) params.set("page", String(filters.page + 1));
  if (filters.size !== 20) params.set("size", String(filters.size));
  return params;
}

export const formatVnd = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} VND`;

export const formatAdminDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const riskPresentation = {
  LOW: { label: "Low risk", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  MEDIUM: { label: "Medium risk", className: "border-amber-200 bg-amber-50 text-amber-800" },
  HIGH: { label: "High risk", className: "border-rose-200 bg-rose-50 text-rose-800" },
} as const;

export const statusPresentation: Record<WithdrawalStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Needs review", className: "border-amber-200 bg-amber-50 text-amber-900" },
  APPROVED: { label: "Ready to pay", className: "border-blue-200 bg-blue-50 text-blue-900" },
  PAID: { label: "Paid", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  REJECTED: { label: "Rejected", className: "border-rose-200 bg-rose-50 text-rose-900" },
  CANCELLED: { label: "Cancelled", className: "border-slate-200 bg-slate-100 text-slate-700" },
};
