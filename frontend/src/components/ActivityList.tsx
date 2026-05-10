import Link from 'next/link';
import { Clock3, ChevronRight, Receipt } from 'lucide-react';
import VisitCard from './VisitCard';
import { StoredVisit } from '@/lib/visits-store';

interface ActivityListProps {
  visits: StoredVisit[];
  /** Maximum items to display before showing "View All". Defaults to 10. */
  limit?: number;
}

export default function ActivityList({ visits, limit = 10 }: ActivityListProps) {
  const displayed = visits.slice(0, limit);
  const hasMore = visits.length > limit;

  return (
    <div className="rounded-3xl border border-stone-200/60 bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3.5 sm:px-5 sm:py-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">Recent Activity</h2>
          <p className="text-xs font-medium text-stone-500">
            {visits.length === 0
              ? 'No visits recorded yet'
              : `${visits.length} total visit${visits.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      {/* Empty state */}
      {visits.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
            <Receipt className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-semibold text-stone-700">No visits yet</p>
          <p className="mt-1 text-xs text-stone-500">
            Your next saved visit will appear here instantly.
          </p>
        </div>
      ) : (
        <>
          {/* Visit list */}
          <ul className="divide-y divide-stone-100">
            {displayed.map((visit) => (
              <li key={visit.id}>
                <VisitCard visit={visit} />
              </li>
            ))}
          </ul>

          {/* View All link */}
          {hasMore && (
            <div className="border-t border-stone-100 px-4 py-3 sm:px-5">
              <Link
                href="/visits"
                className="group flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                View all {visits.length} visits
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
