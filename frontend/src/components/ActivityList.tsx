import Link from 'next/link';
import { ChevronRight, Receipt } from 'lucide-react';
import VisitListItem from './ui/VisitListItem';

interface ActivityListProps {
  visits: any[];
  /** Maximum items to display. Defaults to 10. */
  limit?: number;
}

export default function ActivityList({ visits, limit = 10 }: ActivityListProps) {
  const displayed = visits.slice(0, limit);

  return (
    <div className="rounded-3xl border border-stone-200/60 dark:border-stone-700/60 bg-white dark:bg-stone-900 shadow-card dark:shadow-dark-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 px-4 py-3.5 sm:px-5 sm:py-4 bg-stone-50/30 dark:bg-stone-800/30">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Recent Activity</h2>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            {visits.length === 0
              ? 'No visits recorded yet'
              : `Latest ${displayed.length} records`}
          </p>
        </div>
        <Link
          href="/visits"
          className="flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 text-xs font-bold text-stone-600 dark:text-stone-400 transition-all hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-brand-600 dark:hover:text-brand-400 active:scale-95"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      {visits.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
            <Receipt className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-semibold text-stone-700 dark:text-stone-300">No visits yet</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Your next saved visit will appear here instantly.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {displayed.map((visit, i) => (
            <li key={visit.id || i}>
              <VisitListItem visit={visit} showTags={true} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
