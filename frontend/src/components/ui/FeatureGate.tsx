'use client';

import { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface FeatureGateProps {
  /** The feature key to check against user.features */
  feature: string;
  /** Content to render when access is granted */
  children: ReactNode;
  /** How to handle gated content */
  fallback?: 'lock' | 'hide' | 'blur' | ReactNode;
  /** Custom upgrade message */
  upgradeMessage?: string;
}

export default function FeatureGate({
  feature,
  children,
  fallback = 'lock',
  upgradeMessage,
}: FeatureGateProps) {
  const { hasFeatureAccess } = useAuth();

  if (hasFeatureAccess(feature)) {
    return <>{children}</>;
  }

  // If fallback is 'hide', render nothing
  if (fallback === 'hide') {
    return null;
  }

  // If fallback is a custom ReactNode, render it
  if (typeof fallback !== 'string') {
    return <>{fallback}</>;
  }

  // Blur mode — show children behind blur overlay
  if (fallback === 'blur') {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none select-none blur-sm opacity-60" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-stone-900/70 backdrop-blur-[2px] rounded-2xl">
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {upgradeMessage || 'Premium Feature'}
            </p>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 max-w-[200px]">
              Upgrade your plan to unlock this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Lock mode (default) — show a lock overlay card
  return (
    <div className="rounded-3xl border border-stone-200/60 dark:border-stone-700/60 bg-stone-50/50 dark:bg-stone-800/50 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500">
          <Lock className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
          {upgradeMessage || 'Premium Feature'}
        </p>
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 max-w-[240px]">
          This feature requires a higher subscription tier. Contact your venue owner to upgrade.
        </p>
      </div>
    </div>
  );
}
