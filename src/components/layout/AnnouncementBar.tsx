import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, ShieldCheck, Truck, ChevronDown, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar: React.FC = () => {
  const { user, switchUserRole } = useAuthStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <div className="bg-surface-900 text-surface-200 text-xs py-2 px-4 border-b border-surface-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Perks */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-brand-300 font-medium">
            <Truck className="w-3.5 h-3.5" />
            <span>Free Express Delivery on orders over $75</span>
          </div>
          <div className="flex items-center gap-1.5 text-surface-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Genuine Certified Multi-Vendor Guarantee</span>
          </div>
        </div>

        {/* Center Flash Promo */}
        <div className="flex-1 text-center md:flex-initial">
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Weekend Flash Deals — Extra 20% off with code</span>
            <span className="underline decoration-dotted font-bold text-white">WELCOME20</span>
          </span>
        </div>

        {/* Right Role Switcher & Help */}
        <div className="flex items-center gap-4 text-surface-300">
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 hover:text-white transition-colors bg-surface-800/80 px-2.5 py-1 rounded-md text-2xs font-semibold"
            >
              <UserCheck className="w-3 h-3 text-brand-400" />
              <span>Role: <strong className="text-white uppercase">{user?.role || 'Guest'}</strong></span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-surface-900 border border-surface-700 shadow-2xl p-1.5 z-50 animate-slide-down">
                <div className="px-2 py-1 text-2xs text-surface-400 font-medium uppercase tracking-wider">
                  Switch Portal View
                </div>
                <button
                  onClick={() => {
                    switchUserRole('customer');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-white hover:bg-surface-800 rounded-lg flex items-center justify-between"
                >
                  <span>Customer Portal</span>
                  {(!user || user.role === 'customer') && <span className="text-brand-400 font-bold">✓</span>}
                </button>
                <button
                  onClick={() => {
                    switchUserRole('seller');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-white hover:bg-surface-800 rounded-lg flex items-center justify-between"
                >
                  <span>Seller Dashboard</span>
                  {user?.role === 'seller' && <span className="text-brand-400 font-bold">✓</span>}
                </button>
                <button
                  onClick={() => {
                    switchUserRole('admin');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-white hover:bg-surface-800 rounded-lg flex items-center justify-between"
                >
                  <span>Admin Console</span>
                  {user?.role === 'admin' && <span className="text-brand-400 font-bold">✓</span>}
                </button>
              </div>
            )}
          </div>

          <Link to="/seller/dashboard" className="hidden lg:inline hover:text-white transition-colors">
            Sell on ShopSphere
          </Link>
          <span className="hidden sm:inline">|</span>
          <Link to="/help" className="hover:text-white transition-colors">
            24/7 Support
          </Link>
        </div>
      </div>
    </div>
  );
};
