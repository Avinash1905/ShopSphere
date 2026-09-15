import React from 'react';
import { useProductStore } from '../../store/productStore';
import { X } from 'lucide-react';

export const ActiveFiltersBar: React.FC = () => {
  const { filters, setFilters, categories, brands } = useProductStore();

  const activeCategory = categories.find((c) => c.id === filters.categoryId || c.slug === filters.categoryId);

  const hasActiveFilters =
    filters.query ||
    filters.categoryId ||
    (filters.brandIds && filters.brandIds.length > 0) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    (filters.stockStatus && filters.stockStatus.length > 0);

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-2xs font-bold uppercase tracking-wider text-surface-400">
        Active Filters:
      </span>

      {/* Query */}
      {filters.query && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 border border-surface-200 px-3 py-1 text-xs font-semibold text-surface-800">
          <span>Search: "{filters.query}"</span>
          <button
            onClick={() => setFilters({ query: undefined })}
            className="hover:text-danger-600 ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {/* Category */}
      {activeCategory && (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-800">
          <span>Category: {activeCategory.name}</span>
          <button
            onClick={() => setFilters({ categoryId: undefined })}
            className="hover:text-danger-600 ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {/* Price */}
      {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 border border-surface-200 px-3 py-1 text-xs font-semibold text-surface-800">
          <span>
            Price: ${filters.minPrice || 0} - ${filters.maxPrice || 'Any'}
          </span>
          <button
            onClick={() => setFilters({ minPrice: undefined, maxPrice: undefined })}
            className="hover:text-danger-600 ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {/* Rating */}
      {filters.minRating && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
          <span>Rating: {filters.minRating}★ & up</span>
          <button
            onClick={() => setFilters({ minRating: undefined })}
            className="hover:text-danger-600 ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {/* Brands */}
      {filters.brandIds?.map((bId) => {
        const brand = brands.find((b) => b.id === bId);
        return (
          <span
            key={bId}
            className="inline-flex items-center gap-1 rounded-full bg-surface-100 border border-surface-200 px-3 py-1 text-xs font-semibold text-surface-800"
          >
            <span>Brand: {brand?.name || bId}</span>
            <button
              onClick={() =>
                setFilters({ brandIds: filters.brandIds?.filter((id) => id !== bId) })
              }
              className="hover:text-danger-600 ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}
    </div>
  );
};
