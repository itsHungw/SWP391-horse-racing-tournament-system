import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WithdrawalAdminFilters } from "../../../types/wallet";

export function WithdrawalFilters({
  filters,
  onChange,
}: {
  filters: WithdrawalAdminFilters;
  onChange: (patch: Partial<WithdrawalAdminFilters>) => void;
}) {
  const [query, setQuery] = useState(filters.query ?? "");
  useEffect(() => setQuery(filters.query ?? ""), [filters.query]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query !== (filters.query ?? "")) onChange({ query: query || undefined, page: 0 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.query, onChange, query]);

  return (
    <section aria-label="Withdrawal filters" className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.5fr)_repeat(5,minmax(130px,1fr))_auto]">
        <label className="relative block">
          <span className="sr-only">Search withdrawals</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="ID, user, email, account" className="h-11 w-full border border-slate-300 bg-[#fbfbfa] pl-10 pr-3 text-sm outline-none focus-visible:border-[#070f4f] focus-visible:ring-2 focus-visible:ring-[#070f4f]/20" />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select value={filters.status ?? ""} onChange={(e) => onChange({ status: (e.target.value || undefined) as WithdrawalAdminFilters["status"], page: 0 })} className="h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold">
            <option value="">All statuses</option><option value="REQUESTED">Needs review</option><option value="APPROVED">Ready to pay</option><option value="PAID">Paid</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Risk</span>
          <select value={filters.risk ?? ""} onChange={(e) => onChange({ risk: (e.target.value || undefined) as WithdrawalAdminFilters["risk"], page: 0 })} className="h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold">
            <option value="">All risk levels</option><option value="HIGH">High risk</option><option value="MEDIUM">Medium risk</option><option value="LOW">Low risk</option>
          </select>
        </label>
        <label><span className="sr-only">From date</span><input aria-label="From date" type="date" value={filters.from ?? ""} onChange={(e) => onChange({ from: e.target.value || undefined, page: 0 })} className="h-11 w-full border border-slate-300 px-3 text-sm" /></label>
        <label><span className="sr-only">To date</span><input aria-label="To date" type="date" value={filters.to ?? ""} onChange={(e) => onChange({ to: e.target.value || undefined, page: 0 })} className="h-11 w-full border border-slate-300 px-3 text-sm" /></label>
        <label>
          <span className="sr-only">Sort withdrawals</span>
          <select value={filters.sort ?? "newest"} onChange={(e) => onChange({ sort: e.target.value as WithdrawalAdminFilters["sort"], page: 0 })} className="h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold">
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount_desc">Highest amount</option><option value="risk_desc">Highest risk</option>
          </select>
        </label>
        <button type="button" aria-label="Clear all filters" onClick={() => { setQuery(""); onChange({ query: undefined, status: undefined, risk: undefined, from: undefined, to: undefined, sort: "newest", page: 0 }); }} className="inline-flex h-11 items-center justify-center gap-2 border border-slate-300 px-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b3193a]">
          <X className="h-4 w-4" /> Clear
        </button>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5" /> Filters are reflected in the URL and Excel export.</p>
    </section>
  );
}
