import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`px-5 py-16 text-center ${className}`}>
      {icon && (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600">
          {icon}
        </div>
      )}
      <p className="mt-4 text-base font-bold text-stone-700 dark:text-stone-300">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
