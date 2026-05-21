import { ReactNode } from 'react';

interface Tab {
  key: string;
  label: string;
  icon?: ReactNode;
  /** If true, this tab is disabled / not available */
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onTabChange, fullWidth = false, className = '' }: TabsProps) {
  return (
    <div
      className={`flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-x-auto scrollbar-none ${
        fullWidth ? 'w-full' : 'w-fit'
      } ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              fullWidth ? 'flex-1' : ''
            } ${
              isActive
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            } ${
              tab.disabled
                ? 'opacity-40 cursor-not-allowed'
                : ''
            }`}
          >
            {tab.icon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
