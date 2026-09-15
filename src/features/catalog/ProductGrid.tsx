import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../../components/ui/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { ShoppingBag } from 'lucide-react';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  onQuickView?: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  viewMode = 'grid',
  onQuickView,
}) => {
  const { addItem } = useCartStore();
  const { wishlist, toggleWishlist } = useWishlistStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-surface-300 bg-white space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-surface-900">No Products Matched</h3>
          <p className="text-xs text-surface-500 max-w-sm">
            We couldn't find any products matching your specific filters or search query. Try broadening your criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'flex flex-col gap-4'
      }
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWishlisted={wishlist.some((w) => w.id === product.id)}
          onWishlistToggle={() => toggleWishlist(product)}
          onAddToCart={() => addItem(product.id, product.variants[0]?.id, 1)}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
};
