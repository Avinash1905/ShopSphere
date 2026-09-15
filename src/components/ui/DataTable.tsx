import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string) => {
    if (sortColumnId === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumnId(columnId);
      setSortDirection('asc');
    }
  };

  return (
    <div className={cn('w-full overflow-hidden rounded-xl border border-surface-200 bg-white shadow-xs', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50/75 text-xs font-semibold uppercase tracking-wider text-surface-600">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    'px-5 py-3.5 select-none',
                    col.sortable && 'cursor-pointer hover:bg-surface-100 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-surface-400">
                        {sortColumnId === col.id ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-brand-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-brand-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-surface-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                    <span>Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-surface-500">
                  {emptyState || 'No records found.'}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor(item);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      'transition-colors hover:bg-surface-50/80',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={`${key}-${col.id}`} className={cn('px-5 py-3.5 text-surface-700', col.className)}>
                        {col.cell(item, index)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
