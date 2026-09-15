import React from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { ProductCard } from '../../components/ui/ProductCard';
import { TrendingUp, ArrowRight } from 'lucide-react';

export const TrendingProducts: React.FC = () => {
  const { trendingProducts, products } = useProductStore();
  const { addItem } = useCartStore();
  const { wishlist, toggleWishlist } = useWishlistStore();

  const displayTrending = trendingProducts.length > 0 ? trendingProducts : products.slice(0, 8);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-2xs font-bold uppercase tracking-widest">
              High Velocity Picks
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Trending & Best Sellers
          </h2>
        </div>
        <Link
          to="/catalog?filter=trending"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>Explore All Trending</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayTrending.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlist.some((w) => w.id === product.id)}
            onWishlistToggle={() => toggleWishlist(product)}
            onAddToCart={() => addItem(product.id, product.variants[0]?.id, 1)}
          />
        ))}
      </div>
    </section>
  );
};
