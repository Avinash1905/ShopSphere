import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-3', className)}>
      {totalRecords !== undefined && pageSize !== undefined && (
        <p className="text-xs text-surface-500">
          Showing{' '}
          <span className="font-semibold text-surface-800">
            {(currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-surface-800">
            {Math.min(currentPage * pageSize, totalRecords)}
          </span>{' '}
          of <span className="font-semibold text-surface-800">{totalRecords}</span> results
        </p>
      )}

      <nav aria-label="Pagination" className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {visiblePages.map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-surface-400">
                ...
              </span>
            );
          }
          const pageNum = page as number;
          const isCurrent = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'min-w-[2rem] h-8 rounded-lg px-2.5 text-xs font-semibold transition-colors',
                isCurrent
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-surface-700 hover:bg-surface-100 active:bg-surface-200'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};
