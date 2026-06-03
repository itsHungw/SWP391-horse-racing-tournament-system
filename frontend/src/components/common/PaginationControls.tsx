type PaginationControlsProps = {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
};

export function PaginationControls({
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endItem = Math.min(clampedPage * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-bold text-slate-500">
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      <div className="flex items-center gap-3">
        <button
          aria-label="Previous page"
          className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={clampedPage <= 1}
          onClick={() => onPageChange(clampedPage - 1)}
          type="button"
        >
          Previous
        </button>
        <span className="text-sm font-black text-slate-700">
          Page {clampedPage} of {totalPages}
        </span>
        <button
          aria-label="Next page"
          className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={clampedPage >= totalPages}
          onClick={() => onPageChange(clampedPage + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
