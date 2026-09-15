import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { categories } = useProductStore();

  const currentCategory = categories.find((c) => c.slug === categorySlug) || categories[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Categories', href: '/catalog' },
          { label: currentCategory?.name || 'Category', isCurrent: true },
        ]}
      />

      {/* Category Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-surface-950 to-brand-950 text-white p-8 sm:p-12 shadow-xl">
        <div className="max-w-xl space-y-4 z-10 relative">
          <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-300 border border-brand-500/30">
            Official Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{currentCategory?.name}</h1>
          <p className="text-xs sm:text-sm text-surface-300 leading-relaxed">
            {currentCategory?.description || 'Explore authentic products certified with official manufacturer warranties.'}
          </p>
          <Link
            to={`/catalog?category=${currentCategory?.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-500 transition-colors"
          >
            <span>Browse All {currentCategory?.name}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Subcategories Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-surface-900">Explore Subcategories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentCategory?.subcategories?.map((sub) => (
            <Link
              key={sub.id}
              to={`/catalog?category=${currentCategory.slug}&subcategory=${sub.slug}`}
              className="flex items-center justify-between p-5 rounded-2xl border border-surface-200 bg-white shadow-2xs hover:shadow-md hover:border-brand-300 transition-all group"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                  {sub.name}
                </h4>
                <p className="text-3xs text-surface-400 font-medium">
                  {sub.itemCount ? `${sub.itemCount} products` : 'Browse collection'}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-50 text-surface-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
