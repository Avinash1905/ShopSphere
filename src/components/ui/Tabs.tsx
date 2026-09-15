import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  const containerVariants = {
    underline: 'flex border-b border-surface-200 gap-6',
    pills: 'inline-flex p-1 bg-surface-100 rounded-xl gap-1',
    enclosed: 'flex border-b border-surface-200 gap-2',
  };

  const tabVariants = {
    underline: (active: boolean) =>
      cn(
        'group inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors select-none -mb-px',
        active
          ? 'border-brand-600 text-brand-600'
          : 'border-transparent text-surface-500 hover:border-surface-300 hover:text-surface-700'
      ),
    pills: (active: boolean) =>
      cn(
        'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all select-none',
        active
          ? 'bg-white text-surface-900 shadow-sm'
          : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/60'
      ),
    enclosed: (active: boolean) =>
      cn(
        'inline-flex items-center gap-2 rounded-t-lg border-t border-x px-4 py-2.5 text-sm font-medium transition-colors select-none -mb-px',
        active
          ? 'border-surface-200 bg-white text-brand-600 font-semibold'
          : 'border-transparent text-surface-500 hover:text-surface-800'
      ),
  };

  return (
    <div className={cn(containerVariants[variant], className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              tabVariants[variant](isActive),
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-2 py-0.5 text-2xs font-semibold',
                  isActive
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-surface-200 text-surface-700'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
