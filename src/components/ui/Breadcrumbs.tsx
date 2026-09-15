import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHome = true,
  className,
}) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2 text-xs text-surface-500 py-2', className)}>
      <ol className="flex items-center space-x-2 flex-wrap">
        {showHome && (
          <li className="inline-flex items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-surface-500 hover:text-brand-600 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.isCurrent;
          return (
            <li key={index} className="inline-flex items-center space-x-2">
              <ChevronRight className="h-3.5 w-3.5 text-surface-400 shrink-0" />
              {isLast || !item.href ? (
                <span className="font-semibold text-surface-800" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-brand-600 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
