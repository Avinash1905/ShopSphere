import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, ...props }, ref) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col space-y-1">
        <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              id={inputId}
              type="checkbox"
              ref={ref}
              checked={checked}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                'h-5 w-5 rounded-md border border-surface-300 bg-white transition-all duration-150',
                'peer-focus:ring-2 peer-focus:ring-brand-500/20 peer-focus:border-brand-500',
                'peer-checked:bg-brand-600 peer-checked:border-brand-600',
                'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
                error && 'border-danger-500 peer-focus:border-danger-500',
                className
              )}
            >
              <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150 m-auto" />
            </div>
          </div>
          {(label || description) && (
            <div className="text-sm">
              {label && <span className="font-medium text-surface-800">{label}</span>}
              {description && <p className="text-xs text-surface-500 mt-0.5">{description}</p>}
            </div>
          )}
        </label>
        {error && <p className="text-xs text-danger-600 animate-fade-in pl-8 font-medium">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
