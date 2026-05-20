import { ReactNode } from 'react';
import { Lock } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: 'orange' | 'green' | 'slate' | 'blue' | 'red' | 'brand';
  onClick?: () => void;
  locked?: boolean;
}

const accentConfig = {
  orange: {
    iconBg: 'bg-brand-50',
    iconText: 'text-brand-600',
    valueSuffix: '',
  },
  green: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    valueSuffix: '',
  },
  slate: {
    iconBg: 'bg-stone-100',
    iconText: 'text-stone-600',
    valueSuffix: '',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    valueSuffix: '',
  },
  red: {
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    valueSuffix: '',
  },
  brand: {
    iconBg: 'bg-brand-50',
    iconText: 'text-brand-600',
    valueSuffix: '',
  },
};

export default function StatCard({ label, value, icon, accent = 'orange', onClick, locked }: StatCardProps) {
  const config = accentConfig[accent];

  return (
    <div 
      className={`rounded-3xl border border-stone-200/60 bg-white p-4 shadow-card transition-shadow hover:shadow-soft ${onClick && !locked ? 'cursor-pointer hover:bg-stone-50' : ''} ${locked ? 'opacity-70 bg-stone-50/50' : ''}`}
      onClick={locked ? undefined : onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            {locked && <Lock className="h-3.5 w-3.5 text-stone-400 shrink-0" />}
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            {locked ? '—' : value}
          </p>
        </div>
        {icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${locked ? 'bg-stone-100 text-stone-400' : `${config.iconBg} ${config.iconText}`}`}
            aria-hidden="true"
          >
            {locked ? <Lock className="h-4 w-4" /> : icon}
          </div>
        )}
      </div>
    </div>
  );
}
