import React, { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { Drawer } from '../ui/Drawer';
import { ToastContainer } from '../ui/Toast';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useProductStore } from '../../store/productStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useUiStore } from '../../store/uiStore';
import { QuantitySelector } from '../ui/QuantitySelector';
import { PriceDisplay } from '../ui/PriceDisplay';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export const CustomerLayout: React.FC = () => {
  const {
    items,
    summary,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeItem,
    fetchCart,
  } = useCartStore();
  const { fetchMetadata } = useProductStore();
  const { fetchNotifications } = useNotificationStore();
  const { toasts, dismissToast } = useUiStore();

  useEffect(() => {
    fetchCart();
    fetchMetadata();
    fetchNotifications();
  }, [fetchCart, fetchMetadata, fetchNotifications]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-50 text-surface-900">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <MobileNav />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Slide-over Cart Drawer */}
      <Drawer
        isOpen={isCartDrawerOpen}
        onClose={closeCartDrawer}
        title={
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            <span>Shopping Cart ({summary.totalQuantity})</span>
          </div>
        }
        footer={
          items.length > 0 ? (
            <div className="space-y-3">
              {/* Free Shipping Progress */}
              <div className="space-y-1.5 bg-brand-50/70 p-3 rounded-xl border border-brand-100">
                <div className="flex justify-between text-2xs font-semibold text-brand-900">
                  <span>
                    {summary.amountNeededForFreeShipping === 0
                      ? '🎉 Free Shipping Unlocked!'
                      : `Add $${summary.amountNeededForFreeShipping.toFixed(2)} for Free Shipping`}
                  </span>
                  <span>${summary.freeShippingThreshold} threshold</span>
                </div>
                <div className="h-1.5 w-full bg-brand-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((summary.freeShippingThreshold - summary.amountNeededForFreeShipping) /
                          summary.freeShippingThreshold) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-600">Subtotal</span>
                <span className="font-bold text-surface-900">${summary.subtotal.toFixed(2)}</span>
              </div>

              {summary.discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600">
                  <span>Discount</span>
                  <span>-${summary.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-base font-extrabold border-t border-surface-200 pt-2 text-surface-900">
                <span>Estimated Total</span>
                <span>${summary.grandTotal.toFixed(2)}</span>
              </div>

              <Link
                to="/checkout"
                onClick={closeCartDrawer}
                className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-brand-500/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/cart"
                onClick={closeCartDrawer}
                className="btn-secondary w-full py-2.5 rounded-xl text-xs font-semibold text-center block"
              >
                View Full Cart
              </Link>
            </div>
          ) : null
        }
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-surface-900">Your cart is empty</h4>
              <p className="text-xs text-surface-500">
                Discover trending gadgets, designer fashion, and home essentials.
              </p>
            </div>
            <Link
              to="/catalog"
              onClick={closeCartDrawer}
              className="btn-primary px-5 py-2 text-xs font-bold rounded-xl"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex gap-3.5">
                <img
                  src={item.product.images[0]?.url}
                  alt={item.product.title}
                  className="h-20 w-20 rounded-xl object-cover border border-surface-200 bg-surface-100 shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${item.product.slug}`}
                        onClick={closeCartDrawer}
                        className="text-xs font-bold text-surface-900 hover:text-brand-600 transition-colors line-clamp-1"
                      >
                        {item.product.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-surface-400 hover:text-danger-600 transition-colors p-0.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <p className="text-3xs text-surface-500">
                        {Object.entries(item.selectedAttributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' | ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <QuantitySelector
                      quantity={item.quantity}
                      min={1}
                      max={item.maxAvailableQuantity || 10}
                      size="sm"
                      onChange={(newQty) => updateQuantity(item.id, newQty)}
                    />
                    <PriceDisplay price={item.totalPrice} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};
