import { Clock3, Receipt } from 'lucide-react';
import Card from './ui/Card';
import { StoredVisit } from '@/lib/visits-store';

interface ActivityListProps {
  visits: StoredVisit[];
}

const displayName = (visit: StoredVisit) => visit.name?.trim() || visit.phoneNumber;

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return `${isToday ? 'Today' : date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

export default function ActivityList({ visits }: ActivityListProps) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">Recent activity</h2>
          <p className="text-sm font-medium text-slate-500">Last 5 saved visits</p>
        </div>
        <Clock3 className="h-5 w-5 text-brand-500" aria-hidden="true" />
      </div>

      {visits.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Receipt className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-base font-extrabold text-slate-900">No visits yet</p>
          <p className="mt-1 text-sm text-slate-500">Your next saved visit will appear here instantly.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visits.slice(0, 5).map((visit) => (
            <li key={visit.id} className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                {displayName(visit).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-extrabold text-slate-950">{displayName(visit)}</p>
                <p className="truncate text-sm font-medium text-slate-500">{visit.name ? visit.phoneNumber : 'Walk-in customer'}</p>
              </div>
              <p className="shrink-0 text-right text-xs font-bold text-slate-400">{formatTime(visit.visitedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
