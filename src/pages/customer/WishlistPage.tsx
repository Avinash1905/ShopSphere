import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { PriceDisplay } from '../../components/ui/PriceDisplay';
import { RatingStars } from '../../components/ui/RatingStars';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { addToast } = useUiStore();

  const handleMoveToCart = async (product: any) => {
    await addItem(product.id, product.variants[0]?.id, 1);
    removeFromWishlist(product.id);
    addToast({
      type: 'success',
      title: 'Moved to Cart!',
      message: `${product.title} has been transferred to your cart.`,
    });
  };

  const handleMoveAllToCart = async () => {
    for (const product of wishlist) {
      await addItem(product.id, product.variants[0]?.id, 1);
    }
    clearWishlist();
    addToast({
      type: 'success',
      title: 'All Items Moved! 🎉',
      message: 'All wishlist items have been added to your cart.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Saved Wishlist', isCurrent: true }]} />

      <div className="flex items-center justify-between border-b border-surface-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight">
            My Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Keep track of items you love and move them directly to cart when ready.
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMoveAllToCart}
              className="btn-primary text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              Move All to Cart
            </button>
            <button
              type="button"
              onClick={() => clearWishlist()}
              className="p-2 text-surface-400 hover:text-danger-600 transition-colors"
              title="Clear Wishlist"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-surface-200 bg-white shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 mx-auto">
            <Heart className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-surface-900">Your wishlist is empty</h3>
            <p className="text-xs text-surface-500">
              Save your favorite gadgets, apparel, and home items for later by tapping the heart icon.
            </p>
          </div>
          <Link to="/catalog" className="btn-primary px-6 py-3 rounded-xl font-bold inline-flex">
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-surface-200 bg-white p-4 shadow-2xs hover:shadow-lg transition-all"
            >
              <div>
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-100 mb-3">
                  <img
                    src={product.images[0]?.url}
                    alt={product.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-surface-400 hover:text-danger-600 shadow-sm"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-3xs font-bold uppercase tracking-wider text-brand-600">
                    {product.brand?.name}
                  </span>
                  <Link
                    to={`/product/${product.slug}`}
                    className="text-xs font-bold text-surface-900 hover:text-brand-600 transition-colors line-clamp-2 block leading-snug"
                  >
                    {product.title}
                  </Link>
                  <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="xs" />
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-surface-100 flex items-center justify-between">
                <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="md" />

                <button
                  type="button"
                  onClick={() => handleMoveToCart(product)}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 shadow-xs transition-colors"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Move</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
