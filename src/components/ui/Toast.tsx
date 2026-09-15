import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
  onClose?: (id: string) => void;
}

export const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-danger-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-brand-500 shrink-0" />,
  };

  const borders = {
    success: 'border-success-200',
    error: 'border-danger-200',
    warning: 'border-warning-200',
    info: 'border-brand-200',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-4 shadow-xl border animate-slide-down transition-all',
        borders[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 space-y-1">
        {toast.title && <h6 className="text-sm font-semibold text-surface-900">{toast.title}</h6>}
        <p className="text-xs text-surface-600 leading-normal">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss, onClose }) => {
  const handleDismiss = onDismiss || onClose || (() => {});
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-2 px-4 py-6 sm:p-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
