import React from 'react';
import { cn } from '../../utils/cn';
import { Minus, Plus } from 'lucide-react';

export interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  size = 'md',
  className,
}) => {
  const handleDecrement = () => {
    if (quantity > min) onChange(quantity - 1);
  };

  const handleIncrement = () => {
    if (quantity < max) onChange(quantity + 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val < min) onChange(min);
    else if (val > max) onChange(max);
    else onChange(val);
  };

  const sizes = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  const buttonSizes = {
    sm: 'w-7',
    md: 'w-9',
    lg: 'w-11',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-surface-300 bg-white shadow-2xs overflow-hidden select-none',
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        disabled={disabled || quantity <= min}
        onClick={handleDecrement}
        aria-label="Decrease quantity"
        className={cn(
          'flex h-full items-center justify-center text-surface-600 hover:bg-surface-100 active:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
          buttonSizes[size]
        )}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="number"
        value={quantity}
        onChange={handleChange}
        disabled={disabled}
        min={min}
        max={max}
        aria-label="Product quantity"
        className="w-12 h-full text-center font-semibold text-surface-900 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        disabled={disabled || quantity >= max}
        onClick={handleIncrement}
        aria-label="Increase quantity"
        className={cn(
          'flex h-full items-center justify-center text-surface-600 hover:bg-surface-100 active:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
          buttonSizes[size]
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
