import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { CartItemRow } from '../../features/cart/CartItemRow';
import { CartSummaryCard } from '../../features/cart/CartSummaryCard';
import { SaveForLaterSection } from '../../features/cart/SaveForLaterSection';
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    items,
    summary,
    savedItems,
    isLoading,
    fetchCart,
    fetchSavedItems,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    saveForLater,
    moveToCart,
    removeSavedItem,
  } = useCartStore();

  useEffect(() => {
    fetchCart();
    fetchSavedItems();
  }, [fetchCart, fetchSavedItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Cart & Bag', isCurrent: true }]} />

      <div className="flex items-center justify-between border-b border-surface-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight">
            Shopping Cart ({summary.totalQuantity} items)
          </h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Review your selected items, apply promo vouchers, and calculate delivery.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => clearCart()}
            className="flex items-center gap-1.5 text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Entire Cart</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-surface-200 bg-white shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 mx-auto">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-surface-900">Your cart is currently empty</h3>
            <p className="text-xs text-surface-500">
              Looks like you haven't added anything to your cart yet. Explore thousands of deals!
            </p>
          </div>
          <Link to="/catalog" className="btn-primary px-6 py-3 rounded-xl font-bold inline-flex">
            Explore Deals & Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  onSaveForLater={saveForLater}
                />
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
              </Link>
            </div>

            {/* Save For Later Section */}
            <SaveForLaterSection
              savedItems={savedItems}
              onMoveToCart={moveToCart}
              onRemoveSaved={removeSavedItem}
            />
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-4 sticky top-28">
            <CartSummaryCard
              summary={summary}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
