import { ReactNode } from 'react';
import Card from './ui/Card';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: 'orange' | 'green' | 'slate';
}

const accentClasses = {
  orange: 'bg-brand-50 text-brand-700 ring-brand-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export default function StatCard({ label, value, icon, accent = 'orange' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        {icon && (
          <div className={`rounded-2xl p-2.5 ring-1 ${accentClasses[accent]}`} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
