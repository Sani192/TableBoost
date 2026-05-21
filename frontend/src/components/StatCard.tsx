import { ReactNode } from 'react';
import { Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '@/components/ui/Card';
import { StatCardSkeleton } from '@/components/ui/Skeleton';

interface TrendInfo {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: 'orange' | 'green' | 'slate' | 'blue' | 'red' | 'brand';
  onClick?: () => void;
  locked?: boolean;
  trend?: TrendInfo;
  period?: string;
  loading?: boolean;
}

const accentConfig = {
  orange: {
    iconBg: 'bg-brand-50 dark:bg-brand-900/30',
    iconText: 'text-brand-600 dark:text-brand-400',
  },
  green: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconText: 'text-emerald-600 dark:text-emerald-400',
  },
  slate: {
    iconBg: 'bg-stone-100 dark:bg-stone-700',
    iconText: 'text-stone-600 dark:text-stone-400',
  },
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconText: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    iconBg: 'bg-red-50 dark:bg-red-900/30',
    iconText: 'text-red-600 dark:text-red-400',
  },
  brand: {
    iconBg: 'bg-brand-50 dark:bg-brand-900/30',
    iconText: 'text-brand-600 dark:text-brand-400',
  },
};

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
  down: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
  neutral: { icon: Minus, color: 'text-stone-400 dark:text-stone-500' },
};

export default function StatCard({ label, value, icon, accent = 'orange', onClick, locked, trend, period, loading }: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton />;
  }

  const config = accentConfig[accent];

  return (
    <Card
      className={`p-4 transition-shadow hover:shadow-soft ${onClick && !locked ? 'cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700/50' : ''} ${locked ? 'opacity-70 bg-stone-50/50 dark:bg-stone-800/50' : ''}`}
      onClick={locked ? undefined : onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1">
            {locked && <Lock className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500 shrink-0" />}
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl">
            {locked ? '—' : value}
          </p>
          {/* Trend indicator */}
          {trend && !locked && (
            <div className="mt-1 flex items-center gap-1">
              {(() => {
                const TrendIcon = trendConfig[trend.direction].icon;
                return (
                  <>
                    <TrendIcon className={`h-3.5 w-3.5 ${trendConfig[trend.direction].color}`} />
                    <span className={`text-xs font-bold ${trendConfig[trend.direction].color}`}>
                      {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                    {trend.label && (
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                        {trend.label}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          {/* Period label */}
          {period && !locked && (
            <p className="mt-0.5 text-[10px] font-medium text-stone-400 dark:text-stone-500">
              {period}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${locked ? 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500' : `${config.iconBg} ${config.iconText}`}`}
            aria-hidden="true"
          >
            {locked ? <Lock className="h-4 w-4" /> : icon}
          </div>
        )}
      </div>
    </Card>
  );
}
