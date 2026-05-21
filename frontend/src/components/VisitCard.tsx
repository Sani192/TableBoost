import { StoredVisit } from '@/lib/visits-store';

interface VisitCardProps {
  visit: StoredVisit;
}

const displayName = (visit: StoredVisit) => visit.name?.trim() || visit.phoneNumber;

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const dayLabel = isToday
    ? 'Today'
    : isYesterday
      ? 'Yesterday'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dayLabel}, ${time}`;
};

const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return null;
  return `$${Number(amount).toFixed(2)}`;
};

export default function VisitCard({ visit }: VisitCardProps) {
  const name = displayName(visit);
  const amount = formatAmount(visit.amount);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-stone-50/50 dark:hover:bg-stone-800/50 sm:px-5 sm:py-4">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/40 text-sm font-bold text-brand-700 dark:text-brand-400">
        {name.slice(0, 1).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{name}</p>
        <p className="truncate text-xs font-medium text-stone-500 dark:text-stone-400">
          {visit.name ? visit.phoneNumber : 'Walk-in customer'}
        </p>
      </div>

      {/* Amount + Time */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{amount || '—'}</p>
        <p className="text-xs font-medium text-stone-400">{formatTime(visit.visitedAt)}</p>
      </div>
    </div>
  );
}
