import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { BankLogo } from "./BankLogo";
import type { Bank } from "./banks";

export function BankSelect({
  banks,
  value,
  onChange,
  disabled,
}: {
  banks: Bank[];
  value: string | null;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = banks.find((b) => b.code === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? banks.filter((b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
    : banks;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-white/10 bg-turf-900 px-3 text-left transition-colors hover:border-white/20 focus:border-gold-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selected ? (
          <>
            <BankLogo code={selected.code} size={28} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ivory">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-sm text-ivory-faint/80">Select your bank</span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 text-ivory-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-turf-850 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)]"
          role="listbox"
        >
          <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
            <Search size={15} className="shrink-0 text-ivory-faint" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search banks"
              className="w-full bg-transparent text-sm text-ivory placeholder:text-ivory-faint/70 focus:outline-none"
            />
          </div>
          <ul className="custom-scrollbar max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-ivory-faint">No banks found</li>
            ) : (
              filtered.map((bank) => {
                const active = bank.code === value;
                return (
                  <li key={bank.code} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(bank.code);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${
                        active ? "bg-gold-400/10" : ""
                      }`}
                    >
                      <BankLogo code={bank.code} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ivory">{bank.name}</span>
                        <span className="block truncate font-data text-[11px] text-ivory-faint">{bank.fullName}</span>
                      </span>
                      {active ? <Check size={16} className="shrink-0 text-gold-300" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
