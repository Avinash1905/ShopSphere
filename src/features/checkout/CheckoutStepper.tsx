import React from 'react';
import { CheckoutStep } from '../../types';
import { Check, MapPin, Truck, CreditCard, ClipboardCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepClick?: (step: CheckoutStep) => void;
}

interface StepConfig {
  id: CheckoutStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { id: 'address', label: 'Shipping Address', icon: MapPin },
  { id: 'shipping', label: 'Delivery Method', icon: Truck },
  { id: 'payment', label: 'Payment Method', icon: CreditCard },
  { id: 'review', label: 'Review & Place', icon: ClipboardCheck },
];

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Checkout Progress" className="w-full py-4 px-2 sm:px-6">
      <ol className="flex items-center justify-between w-full max-w-4xl mx-auto">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted && onStepClick;
          const Icon = step.icon;

          return (
            <li key={step.id} className="relative flex-1 flex items-center group">
              <div className="flex flex-col items-center mx-auto text-center z-10">
                <button
                  type="button"
                  disabled={!isClickable && !isCurrent}
                  onClick={() => isClickable && onStepClick(step.id)}
                  className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border-2',
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-lg shadow-indigo-500/30'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                  )}
                </button>
                <span
                  className={cn(
                    'mt-2 text-xs sm:text-sm font-medium tracking-tight transition-colors',
                    isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 sm:top-6 left-1/2 w-full h-[2px] transition-colors -z-0',
                    idx < currentIndex
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
