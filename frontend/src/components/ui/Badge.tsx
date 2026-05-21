import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'premium' | 'brand';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  success:
    'bg-emerald-50 text-emerald-800 border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
  warning:
    'bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40',
  danger:
    'bg-rose-50 text-rose-800 border-rose-200/60 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/40',
  info:
    'bg-blue-50 text-blue-800 border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40',
  neutral:
    'bg-stone-100 text-stone-700 border-stone-200/60 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700/40',
  premium:
    'bg-brand-50 text-brand-800 border-brand-200/60 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-700/40',
  brand:
    'bg-brand-50 text-brand-800 border-brand-200/60 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-700/40',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px] gap-0.5',
  md: 'px-2.5 py-0.5 text-[11px] gap-1',
};

export default function Badge({
  children,
  variant = 'neutral',
  icon,
  className = '',
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold shadow-sm ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {children}
    </span>
  );
}
