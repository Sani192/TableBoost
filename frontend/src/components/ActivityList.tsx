import Link from 'next/link';
import { Clock3, ChevronRight, Receipt } from 'lucide-react';
import VisitCard from './VisitCard';
import { StoredVisit } from '@/lib/visits-store';

interface ActivityListProps {
  visits: StoredVisit[];
  /** Maximum items to display. Defaults to 10. */
  limit?: number;
}

export default function ActivityList({ visits, limit = 10 }: ActivityListProps) {
  const displayed = visits.slice(0, limit);

  return (
    <div className="rounded-3xl border border-stone-200/60 bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3.5 sm:px-5 sm:py-4 bg-stone-50/30">
        <div>
          <h2 className="text-base font-bold text-stone-900">Recent Activity</h2>
          <p className="text-xs font-medium text-stone-500">
            {visits.length === 0
              ? 'No visits recorded yet'
              : `Latest ${displayed.length} records`}
          </p>
        </div>
        <Link
          href="/visits"
          className="flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-600 transition-all hover:bg-stone-50 hover:text-brand-600 active:scale-95"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
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
        <ul className="divide-y divide-stone-100">
          {displayed.map((visit) => (
            <li key={visit.id}>
              <VisitCard visit={visit} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
