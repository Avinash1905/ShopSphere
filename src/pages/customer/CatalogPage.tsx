import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { FilterSidebar } from '../../features/search/FilterSidebar';
import { ActiveFiltersBar } from '../../features/search/ActiveFiltersBar';
import { ProductSortBar } from '../../features/catalog/ProductSortBar';
import { ProductGrid } from '../../features/catalog/ProductGrid';
import { Pagination } from '../../components/ui/Pagination';
import { Drawer } from '../../components/ui/Drawer';

export const CatalogPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    products,
    totalProducts,
    totalPages,
    currentPage,
    filters,
    viewMode,
    isLoading,
    fetchProducts,
    setFilters,
    setViewMode,
  } = useProductStore();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const brand = searchParams.get('brand');
    const filter = searchParams.get('filter');

    const paramsToSet: any = {};
    if (q) paramsToSet.query = q;
    if (category) paramsToSet.categoryId = category;
    if (subcategory) paramsToSet.subCategoryId = subcategory;
    if (brand) paramsToSet.brandIds = [brand];
    if (filter === 'deals') paramsToSet.dealsOnly = true;

    setFilters(paramsToSet);
  }, [searchParams, setFilters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Catalog', href: '/catalog' },
          { label: filters.query ? `Search: "${filters.query}"` : 'Browse Products', isCurrent: true },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filter */}
        <div className="hidden lg:block lg:col-span-1 sticky top-28">
          <FilterSidebar />
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Products"
          placement="left"
        >
          <FilterSidebar onCloseMobile={() => setIsMobileFilterOpen(false)} />
        </Drawer>

        {/* Main Products Section */}
        <div className="lg:col-span-3 space-y-6">
          <ProductSortBar
            totalCount={totalProducts}
            sortBy={filters.sortBy || 'featured'}
            onSortChange={(sortBy) => setFilters({ sortBy })}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
          />

          <ActiveFiltersBar />

          <ProductGrid products={products} isLoading={isLoading} viewMode={viewMode} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalProducts}
            pageSize={filters.limit || 12}
            onPageChange={(page) => setFilters({ page })}
          />
        </div>
      </div>
    </div>
  );
};
