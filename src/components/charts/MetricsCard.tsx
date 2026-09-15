import React from 'react';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  changePercentage?: number;
  changePeriod?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'purple';
  description?: string;
  className?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  changePercentage,
  changePeriod = 'vs last month',
  icon,
  variant = 'default',
  description,
  className,
}) => {
  const isPositive = changePercentage !== undefined && changePercentage > 0;
  const isNegative = changePercentage !== undefined && changePercentage < 0;
  const isNeutral = changePercentage !== undefined && changePercentage === 0;

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
        'rounded-2xl border border-surface-200 bg-white p-6 shadow-2xs transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
          {title}
        </span>
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBgVariants[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-extrabold text-surface-900 tracking-tight">{value}</h3>
      </div>

      {(changePercentage !== undefined || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {changePercentage !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold rounded-md px-1.5 py-0.5',
                isPositive && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                isNegative && 'bg-rose-50 text-rose-700 border border-rose-200',
                isNeutral && 'bg-surface-100 text-surface-600'
              )}
            >
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {isNeutral && <Minus className="h-3 w-3" />}
              {Math.abs(changePercentage)}%
            </span>
          )}
          <span className="text-surface-500">{description || changePeriod}</span>
        </div>
      )}
    </div>
  );
};
