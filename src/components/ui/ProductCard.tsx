import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Product } from '../../types';
import { RatingStars } from './RatingStars';
import { PriceDisplay } from './PriceDisplay';
import { Heart, ShoppingBag, Eye } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onWishlistToggle?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
  onQuickView,
  className,
}) => {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const secondaryImage = product.images[1] || primaryImage;

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border border-surface-200 bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden',
        className
      )}
    >
      {/* Badges container */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.isDealOfTheDay && (
          <span className="rounded-full bg-danger-600 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-white shadow-sm">
            Deal of the Day
          </span>
        )}
        {product.isTrending && !product.isDealOfTheDay && (
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-white shadow-sm">
            Trending
          </span>
        )}
        {product.isNewArrival && !product.isTrending && !product.isDealOfTheDay && (
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-white shadow-sm">
            New
          </span>
        )}
      </div>

      {/* Wishlist button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onWishlistToggle && onWishlistToggle(product);
        }}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-xs transition-all duration-200 hover:scale-110 active:scale-95',
          isWishlisted ? 'text-rose-500' : 'text-surface-400 hover:text-rose-500'
        )}
      >
        <Heart className={cn('h-4 w-4 transition-colors', isWishlisted && 'fill-current')} />
      </button>

      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-surface-100"
      >
        <img
          src={primaryImage?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'}
          alt={primaryImage?.altText || product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
          }}
        />
        {secondaryImage && secondaryImage.url !== primaryImage?.url && (
          <img
            src={secondaryImage.url}
            alt={secondaryImage.altText || product.title}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
            }}
          />
        )}

        {/* Quick Action Overlay on Hover */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-t from-surface-950/40 to-transparent">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-surface-800 shadow-md backdrop-blur-xs hover:bg-white hover:text-brand-600 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Quick View
            </button>
          )}
          {onAddToCart && product.stockStatus !== 'out_of_stock' && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand & Category */}
        <div className="flex items-center justify-between text-2xs text-surface-500 mb-1">
          <span className="font-semibold uppercase tracking-wider text-brand-600">
            {product.brand?.name}
          </span>
          <span>{product.category?.name}</span>
        </div>

        {/* Title */}
        <Link
          to={`/product/${product.slug}`}
          className="mb-2 line-clamp-2 text-sm font-semibold text-surface-900 transition-colors hover:text-brand-600 leading-snug"
        >
          {product.title}
        </Link>

        {/* Rating */}
        <div className="mb-3">
          <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="xs" />
        </div>

        {/* Price & Variant Count */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-surface-100">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            size="md"
          />
          {product.variants && product.variants.length > 1 && (
            <span className="text-2xs font-medium text-surface-500">
              {product.variants.length} options
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
