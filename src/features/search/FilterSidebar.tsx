import React from 'react';
import { useProductStore } from '../../store/productStore';
import { Checkbox } from '../../components/ui/Checkbox';
import { RotateCcw, Filter, Star } from 'lucide-react';

export interface FilterSidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  className,
  onCloseMobile,
}) => {
  const { categories, brands, filters, setFilters, resetFilters } = useProductStore();

  const handleCategoryChange = (categoryId: string) => {
    if (filters.categoryId === categoryId) {
      setFilters({ categoryId: undefined, subCategoryId: undefined });
    } else {
      setFilters({ categoryId, subCategoryId: undefined });
    }
  };

  const handleBrandToggle = (brandId: string) => {
    const current = filters.brandIds || [];
    if (current.includes(brandId)) {
      setFilters({ brandIds: current.filter((id) => id !== brandId) });
    } else {
      setFilters({ brandIds: [...current, brandId] });
    }
  };

  const handleRatingSelect = (rating: number) => {
    if (filters.minRating === rating) {
      setFilters({ minRating: undefined });
    } else {
      setFilters({ minRating: rating });
    }
  };

  const handlePriceChange = (min?: number, max?: number) => {
    setFilters({ minPrice: min, maxPrice: max });
  };

  return (
    <aside className={`space-y-6 bg-white p-6 rounded-3xl border border-surface-200 shadow-2xs ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 pb-4">
        <div className="flex items-center gap-2 font-bold text-surface-900 text-sm">
          <Filter className="h-4 w-4 text-brand-600" />
          <span>Filter Products</span>
        </div>
        <button
          type="button"
          onClick={() => {
            resetFilters();
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex items-center gap-1 text-2xs font-semibold text-surface-500 hover:text-brand-600 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700">
          Price Range ($)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-3xs text-surface-500">Min Price</label>
            <input
              type="number"
              value={filters.minPrice || ''}
              placeholder="0"
              min={0}
              onChange={(e) =>
                handlePriceChange(
                  e.target.value ? Number(e.target.value) : undefined,
                  filters.maxPrice
                )
              }
              className="w-full rounded-xl border border-surface-300 px-3 py-1.5 text-xs text-surface-900 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-3xs text-surface-500">Max Price</label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              placeholder="5000"
              min={0}
              onChange={(e) =>
                handlePriceChange(
                  filters.minPrice,
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full rounded-xl border border-surface-300 px-3 py-1.5 text-xs text-surface-900 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Categories Multi-Select */}
      <div className="space-y-3 border-t border-surface-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700">Categories</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center justify-between text-xs text-surface-700 cursor-pointer hover:text-brand-600 select-none"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.categoryId === cat.id || filters.categoryId === cat.slug}
                  onChange={() => handleCategoryChange(cat.id)}
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-500/20"
                />
                <span className="font-medium line-clamp-1">{cat.name}</span>
              </div>
              <span className="text-3xs text-surface-400 font-mono">
                {cat.itemCount || 0}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands Multi-Select */}
      <div className="space-y-3 border-t border-surface-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700">Brands</h4>
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <label
              key={brand.id}
              className="flex items-center justify-between text-xs text-surface-700 cursor-pointer hover:text-brand-600 select-none"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(filters.brandIds || []).includes(brand.id)}
                  onChange={() => handleBrandToggle(brand.id)}
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-500/20"
                />
                <span className="font-medium">{brand.name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-3 border-t border-surface-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700">Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => handleRatingSelect(stars)}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                filters.minRating === stars
                  ? 'bg-brand-50 text-brand-700 font-bold'
                  : 'hover:bg-surface-50 text-surface-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span>& up</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div className="space-y-3 border-t border-surface-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700">Availability</h4>
        <div className="space-y-2">
          <Checkbox
            label="In Stock Only"
            checked={(filters.stockStatus || []).includes('in_stock')}
            onChange={(e) => {
              if (e.target.checked) {
                setFilters({ stockStatus: ['in_stock'] });
              } else {
                setFilters({ stockStatus: undefined });
              }
            }}
          />
        </div>
      </div>
    </aside>
  );
};
