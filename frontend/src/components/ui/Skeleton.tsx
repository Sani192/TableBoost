interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  lines?: number;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = 'skeleton-shimmer rounded-xl';

  const variantClasses = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses.text}`}
            style={{
              ...style,
              width: i === lines - 1 ? '60%' : width || '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/* Pre-composed skeleton patterns */

export function StatCardSkeleton() {
  return (
    <div className="rounded-3xl border border-stone-200/60 dark:border-stone-700/60 bg-white dark:bg-stone-800 p-4 shadow-card dark:shadow-dark-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height="12px" />
          <Skeleton variant="rectangular" width="80px" height="32px" />
        </div>
        <Skeleton variant="rectangular" width="36px" height="36px" className="shrink-0 rounded-xl" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Skeleton variant="rectangular" width="40px" height="40px" className="shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton variant="text" width="50%" height="14px" />
        <Skeleton variant="text" width="30%" height="10px" />
      </div>
      <Skeleton variant="rectangular" width="70px" height="22px" className="shrink-0 rounded-full" />
    </div>
  );
}
