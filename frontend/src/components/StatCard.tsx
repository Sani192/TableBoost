import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: 'orange' | 'green' | 'slate' | 'blue' | 'red';
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
};

export default function StatCard({ label, value, icon, accent = 'orange' }: StatCardProps) {
  const config = accentConfig[accent];

  return (
    <div className="rounded-3xl border border-stone-200/60 bg-white p-4 shadow-card transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-stone-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconBg} ${config.iconText}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
