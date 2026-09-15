import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Heart, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';

export const MobileNav: React.FC = () => {
  const { summary, openCartDrawer } = useCartStore();
  const { wishlist } = useWishlistStore();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-surface-200 z-40 md:hidden py-2 px-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-3xs font-semibold ${
              isActive ? 'text-brand-600' : 'text-surface-500 hover:text-surface-900'
            }`
          }
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/catalog"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-3xs font-semibold ${
              isActive ? 'text-brand-600' : 'text-surface-500 hover:text-surface-900'
            }`
          }
        >
          <Compass className="h-5 w-5" />
          <span>Explore</span>
        </NavLink>

        {/* Floating Cart Button */}
        <button
          type="button"
          onClick={openCartDrawer}
          className="relative -mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-transform active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" />
          {summary.totalQuantity > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-3xs font-bold text-white shadow-sm ring-2 ring-white">
              {summary.totalQuantity}
            </span>
          )}
        </button>

        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 text-3xs font-semibold ${
              isActive ? 'text-brand-600' : 'text-surface-500 hover:text-surface-900'
            }`
          }
        >
          <Heart className="h-5 w-5" />
          {wishlist.length > 0 && (
            <span className="absolute -top-1 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-3xs font-bold text-white">
              {wishlist.length}
            </span>
          )}
          <span>Wishlist</span>
        </NavLink>

        <NavLink
          to="/customer/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-3xs font-semibold ${
              isActive ? 'text-brand-600' : 'text-surface-500 hover:text-surface-900'
            }`
          }
        >
          <User className="h-5 w-5" />
          <span>Account</span>
        </NavLink>
      </div>
    </nav>
  );
};
