import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div
      className={`bg-stone-50/50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-700 px-6 py-4 flex items-center justify-between ${className}`}
    >
      <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
        Showing {start} – {end} of {totalCount} records
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 text-stone-600 dark:text-stone-400" />
        </button>
        <span className="text-sm font-extrabold text-stone-700 dark:text-stone-300 px-2">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 text-stone-600 dark:text-stone-400" />
        </button>
      </div>
    </div>
  );
}
