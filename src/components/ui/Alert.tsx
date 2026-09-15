import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  onClose,
  ...props
}) => {
  const icons = {
    info: <Info className="h-5 w-5 text-brand-600 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-success-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0" />,
    danger: <AlertCircle className="h-5 w-5 text-danger-600 shrink-0" />,
  };

  const styles = {
    info: 'bg-brand-50 border-brand-200 text-brand-900',
    success: 'bg-success-50 border-success-200 text-success-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    danger: 'bg-danger-50 border-danger-200 text-danger-900',
  };

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-xl border animate-fade-in text-sm', styles[variant], className)}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-surface-700 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="rounded-lg p-1 text-surface-400 hover:text-surface-700 hover:bg-surface-200/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
