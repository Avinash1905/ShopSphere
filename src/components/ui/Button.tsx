import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus:ring-brand-500 shadow-sm',
      secondary: 'bg-surface-100 text-surface-800 hover:bg-surface-200 active:bg-surface-300 focus:ring-surface-400',
      outline: 'border border-surface-300 bg-transparent text-surface-800 hover:bg-surface-100 active:bg-surface-200 focus:ring-brand-500',
      ghost: 'bg-transparent text-surface-700 hover:bg-surface-100 hover:text-surface-900 focus:ring-surface-400',
      danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 focus:ring-danger-500 shadow-sm',
      success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus:ring-success-500 shadow-sm',
    };

    const sizes = {
      xs: 'px-2 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2',
      xl: 'px-6 py-3.5 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
