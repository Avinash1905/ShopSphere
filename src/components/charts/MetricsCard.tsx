import React from 'react';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  changePercentage?: number;
  change?: number;
  changePeriod?: string;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'purple';
  description?: string;
  className?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  changePercentage,
  change,
  changePeriod = 'vs last month',
  changeLabel,
  icon,
  variant = 'default',
  description,
  className,
}) => {
  const effectiveChange = change !== undefined ? change : changePercentage;
  const effectiveLabel = description || changeLabel || changePeriod;
  const isPositive = effectiveChange !== undefined && effectiveChange > 0;
  const isNegative = effectiveChange !== undefined && effectiveChange < 0;
  const isNeutral = effectiveChange !== undefined && effectiveChange === 0;

  const iconBgVariants = {
    default: 'bg-surface-100 text-surface-700',
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-200 bg-white dark:bg-slate-900 p-6 shadow-2xs transition-all duration-200 hover:shadow-md dark:border-slate-800',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBgVariants[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">{value}</h3>
      </div>

      {(effectiveChange !== undefined || effectiveLabel) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {effectiveChange !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold rounded-md px-1.5 py-0.5',
                isPositive && 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
                isNegative && 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
                isNeutral && 'bg-surface-100 text-surface-600 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {isNeutral && <Minus className="h-3 w-3" />}
              {Math.abs(effectiveChange)}%
            </span>
          )}
          <span className="text-surface-500 dark:text-slate-400">{effectiveLabel}</span>
        </div>
      )}
    </div>
  );
};
