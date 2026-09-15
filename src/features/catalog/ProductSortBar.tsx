import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Select } from '../../components/ui/Select';

export interface ProductSortBarProps {
  totalCount: number;
  sortBy: string;
  onSortChange: (sort: any) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onOpenMobileFilters?: () => void;
}

const SORT_OPTIONS = [
  { label: 'Featured & Recommended', value: 'featured' },
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_low_high' },
  { label: 'Price: High to Low', value: 'price_high_low' },
  { label: 'Customer Rating', value: 'rating' },
  { label: 'Biggest Discount', value: 'discount' },
];

export const ProductSortBar: React.FC<ProductSortBarProps> = ({
  totalCount,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenMobileFilters,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-surface-200 shadow-2xs">
      <div className="flex items-center gap-3">
        {onOpenMobileFilters && (
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden btn-secondary text-xs px-3.5 py-2 font-bold"
          >
            Filters
          </button>
        )}
        <p className="text-xs text-surface-600">
          Showing <strong className="text-surface-900 font-bold">{totalCount}</strong> products
        </p>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="w-48">
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>

        <div className="flex items-center rounded-xl bg-surface-100 p-1 border border-surface-200">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-white text-brand-600 shadow-xs' : 'text-surface-500 hover:text-surface-900'
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-white text-brand-600 shadow-xs' : 'text-surface-500 hover:text-surface-900'
            }`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
