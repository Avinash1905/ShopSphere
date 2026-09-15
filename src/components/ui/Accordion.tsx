import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
  defaultExpandedIds?: string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultExpandedIds = [],
  className,
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(defaultExpandedIds);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setExpandedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setExpandedIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn('divide-y divide-surface-200 rounded-xl border border-surface-200 bg-white overflow-hidden', className)}>
      {items.map((item) => {
        const isExpanded = expandedIds.includes(item.id);
        return (
          <div key={item.id} className="transition-colors">
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => toggleItem(item.id)}
              aria-expanded={isExpanded}
              className={cn(
                'flex w-full items-center justify-between px-5 py-4 text-left font-medium text-surface-900 transition-colors hover:bg-surface-50',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-semibold">{item.title}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-surface-500 transition-transform duration-200',
                  isExpanded && 'rotate-180 text-brand-600'
                )}
              />
            </button>
            {isExpanded && (
              <div className="px-5 pb-4 pt-1 text-sm text-surface-600 animate-fade-in leading-relaxed">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
