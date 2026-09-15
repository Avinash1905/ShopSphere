import React from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { ShieldCheck } from 'lucide-react';

export const BrandSpotlight: React.FC = () => {
  const { brands } = useProductStore();

  return (
    <section className="rounded-3xl border border-surface-200 bg-white p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-2xs font-bold uppercase tracking-widest">
              Authorized Official Partners
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-surface-900 tracking-tight">
            Featured Global Brands
          </h3>
        </div>
        <p className="text-xs text-surface-500 max-w-sm">
          Shop directly from certified manufacturer stores with authentic guarantees and direct warranty coverage.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            to={`/catalog?brands=${brand.id}`}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-surface-100 bg-surface-50/50 hover:bg-white hover:border-brand-300 hover:shadow-md transition-all text-center"
          >
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center font-black text-surface-900 border border-surface-200 shadow-2xs group-hover:scale-110 transition-transform mb-2">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.name} className="h-8 w-8 object-contain rounded-lg" />
              ) : (
                brand.name.charAt(0)
              )}
            </div>
            <span className="text-xs font-bold text-surface-800 group-hover:text-brand-600 transition-colors">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
