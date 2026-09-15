import React from 'react';
import { cn } from '../../utils/cn';

export interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showDiscountBadge?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  currency = '$',
  size = 'md',
  showDiscountBadge = true,
  className,
}) => {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
    : 0;

  const sizeStyles = {
    sm: { price: 'text-sm font-semibold', original: 'text-xs', badge: 'text-2xs' },
    md: { price: 'text-base font-bold', original: 'text-xs', badge: 'text-xs' },
    lg: { price: 'text-xl font-bold', original: 'text-sm', badge: 'text-xs' },
    xl: { price: 'text-2xl font-extrabold', original: 'text-base', badge: 'text-sm' },
    '2xl': { price: 'text-3xl font-extrabold', original: 'text-lg', badge: 'text-sm' },
  };

  const formattedPrice = `${currency}${price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedOriginalPrice = originalPrice
    ? `${currency}${originalPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

  return (
    <div className={cn('inline-flex items-baseline flex-wrap gap-2', className)}>
      <span className={cn('text-surface-900 tracking-tight', sizeStyles[size].price)}>
        {formattedPrice}
      </span>

      {hasDiscount && (
        <>
          <span className={cn('line-through text-surface-400 font-medium', sizeStyles[size].original)}>
            {formattedOriginalPrice}
          </span>
          {showDiscountBadge && (
            <span className={cn('rounded-md bg-danger-50 px-1.5 py-0.5 font-bold text-danger-600 border border-danger-200', sizeStyles[size].badge)}>
              -{discountPercent}%
            </span>
          )}
        </>
      )}
    </div>
  );
};
