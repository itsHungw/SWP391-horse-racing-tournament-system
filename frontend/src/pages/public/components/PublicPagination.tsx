import { ChevronLeft, ChevronRight } from "lucide-react";

export function PublicPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-between border-t border-white/10 pt-6">
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={16} /> Previous
      </button>
      <p className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">
        Page <span className="text-ivory">{page + 1}</span> / {totalPages}
      </p>
      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next <ChevronRight size={16} />
      </button>
    </nav>
  );
}
