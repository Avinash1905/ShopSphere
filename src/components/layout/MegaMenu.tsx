import React from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { ArrowRight, Sparkles } from 'lucide-react';

export const MegaMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { categories } = useProductStore();

  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full inset-x-0 bg-white/95 backdrop-blur-md shadow-2xl border-b border-surface-200 z-40 animate-fade-in"
    >
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {categories.slice(0, 4).map((cat) => (
          <div key={cat.id} className="space-y-3">
            <Link
              to={`/catalog?category=${cat.slug}`}
              onClick={onClose}
              className="group flex items-center gap-2 text-sm font-bold text-surface-900 hover:text-brand-600 transition-colors"
            >
              <span>{cat.name}</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
            <ul className="space-y-2 text-xs text-surface-600">
              {cat.subcategories?.map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/catalog?category=${cat.slug}&subcategory=${sub.slug}`}
                    onClick={onClose}
                    className="hover:text-brand-600 hover:font-medium transition-colors block py-0.5"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Featured Promotion Banner inside MegaMenu */}
        <div className="hidden lg:block col-span-1 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white flex flex-col justify-between shadow-lg">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="h-3 w-3" /> Special
            </span>
            <h5 className="mt-3 text-base font-extrabold leading-tight">
              Titanium Tech Showcase
            </h5>
            <p className="mt-1 text-xs text-brand-100">
              Explore flagship iPhone 15 Pro & M3 Max laptops today.
            </p>
          </div>
          <Link
            to="/catalog?category=electronics"
            onClick={onClose}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Shop Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
