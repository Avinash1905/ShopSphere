import React from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { ArrowRight, Laptop, Shirt, Home, Sparkles, Dumbbell, Gamepad2 } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="h-6 w-6" />,
  Shirt: <Shirt className="h-6 w-6" />,
  Home: <Home className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  Dumbbell: <Dumbbell className="h-6 w-6" />,
  Gamepad2: <Gamepad2 className="h-6 w-6" />,
};

export const CategoryShowcase: React.FC = () => {
  const { categories } = useProductStore();

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xs font-bold uppercase tracking-widest text-brand-600">
            Curated Collections
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Shop by Top Category
          </h2>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>All 50+ Categories</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/catalog?category=${cat.slug}`}
            className="group relative flex flex-col items-center justify-between rounded-2xl border border-surface-200 bg-white p-5 text-center shadow-2xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-brand-300 overflow-hidden"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white shadow-xs">
              {cat.icon && ICON_MAP[cat.icon] ? ICON_MAP[cat.icon] : <Sparkles className="h-6 w-6" />}
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-surface-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                {cat.name}
              </h4>
              <span className="text-3xs text-surface-400 font-medium">
                {cat.itemCount ? `${cat.itemCount.toLocaleString()} items` : 'Explore'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
