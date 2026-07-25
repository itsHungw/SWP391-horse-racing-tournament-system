import type { FormEvent } from "react";
import { Search } from "lucide-react";

type FinanceFiltersProps = {
  from: string;
  to: string;
  query: string;
  typeValue?: string;
  typeLabel: string;
  typeOptions: readonly string[];
  minAmount?: string;
  maxAmount?: string;
  showAmountRange?: boolean;
  onApply: (values: { from: string; to: string; query: string; typeValue: string; minAmount: string; maxAmount: string }) => void;
};

export function FinanceFilters({ from, to, query, typeValue = "", typeLabel, typeOptions, minAmount = "", maxAmount = "", showAmountRange = false, onApply }: FinanceFiltersProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onApply({
      from: String(data.get("from")),
      to: String(data.get("to")),
      query: String(data.get("query") ?? "").trim(),
      typeValue: String(data.get("type") ?? ""),
      minAmount: String(data.get("minAmount") ?? ""),
      maxAmount: String(data.get("maxAmount") ?? ""),
    });
  };

  return (
    <form className={`grid gap-3 border border-slate-200 bg-white p-4 shadow-sm ${showAmountRange ? "lg:grid-cols-4 xl:grid-cols-[minmax(220px,1fr)_150px_150px_170px_140px_140px_auto]" : "lg:grid-cols-[minmax(220px,1fr)_160px_160px_180px_auto]"}`} onSubmit={submit}>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
        Search
        <span className="relative mt-2 block">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input className="min-h-11 w-full border border-slate-300 pl-10 pr-3 text-sm normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b3193a]" defaultValue={query} name="query" placeholder="Email, reference or description" type="search" />
        </span>
      </label>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-600">From<input className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-semibold normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b3193a]" defaultValue={from} name="from" required type="date" /></label>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-600">To<input className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-semibold normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b3193a]" defaultValue={to} name="to" required type="date" /></label>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-600">{typeLabel}<select className="mt-2 min-h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b3193a]" defaultValue={typeValue} name="type"><option value="">All</option>{typeOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>
      {showAmountRange ? <><label className="block text-xs font-black uppercase tracking-wider text-slate-600">Min amount<input className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-semibold normal-case tracking-normal" defaultValue={minAmount} inputMode="numeric" name="minAmount" placeholder="Signed VND" type="number" /></label><label className="block text-xs font-black uppercase tracking-wider text-slate-600">Max amount<input className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-semibold normal-case tracking-normal" defaultValue={maxAmount} inputMode="numeric" name="maxAmount" placeholder="Signed VND" type="number" /></label></> : null}
      <button className="min-h-11 self-end bg-[#070f4f] px-5 text-sm font-black text-white hover:bg-[#101a70] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]" type="submit">Apply filters</button>
    </form>
  );
}
