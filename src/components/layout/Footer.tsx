import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Send, ShieldCheck, Truck, RotateCcw, Headphones, CreditCard } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

export const Footer: React.FC = () => {
  const { addToast } = useUiStore();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      addToast({
        type: 'success',
        title: 'Subscribed! 🎉',
        message: 'You have been enrolled in exclusive VIP discounts and early drops.',
      });
      setEmail('');
    }
  };

  return (
    <footer className="bg-surface-900 text-surface-300 pt-16 pb-24 md:pb-12 border-t border-surface-800">
      {/* Guarantees Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 border-b border-surface-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-800 text-brand-400 shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Express Shipping</h5>
              <p className="text-2xs text-surface-400">Free delivery on orders $75+</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-800 text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Certified Authentic</h5>
              <p className="text-2xs text-surface-400">100% verified brands & sellers</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-800 text-amber-400 shrink-0">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">30-Day Returns</h5>
              <p className="text-2xs text-surface-400">Hassle-free direct refund policy</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-800 text-purple-400 shrink-0">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">24/7 Concierge</h5>
              <p className="text-2xs text-surface-400">Instant expert chat & support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand & Newsletter Column */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Shop<span className="text-brand-400">Sphere</span>
            </span>
          </Link>
          <p className="text-xs text-surface-400 leading-relaxed max-w-sm">
            ShopSphere is the premier multi-vendor marketplace connecting passionate creators and verified global brands with discerning customers worldwide.
          </p>

          <form onSubmit={handleSubscribe} className="pt-2">
            <label className="block text-2xs font-bold uppercase tracking-wider text-surface-300 mb-2">
              Subscribe for VIP flash drops & vouchers
            </label>
            <div className="flex max-w-md rounded-xl bg-surface-800 p-1 border border-surface-700 focus-within:border-brand-500">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full bg-transparent px-3 text-xs text-white placeholder-surface-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500 transition-colors shadow-sm"
              >
                <span>Join</span> <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Popular Catalogs</h4>
          <ul className="space-y-2 text-xs text-surface-400">
            <li><Link to="/catalog?category=electronics" className="hover:text-white transition-colors">Electronics & Audio</Link></li>
            <li><Link to="/catalog?category=fashion" className="hover:text-white transition-colors">Designer Fashion</Link></li>
            <li><Link to="/catalog?category=home-living" className="hover:text-white transition-colors">Scandinavian Home</Link></li>
            <li><Link to="/catalog?category=beauty-wellness" className="hover:text-white transition-colors">Luxury Skincare</Link></li>
            <li><Link to="/catalog?category=gaming" className="hover:text-white transition-colors">Gaming & Peripherals</Link></li>
          </ul>
        </div>

        {/* Portals & Sellers */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Merchant & Portals</h4>
          <ul className="space-y-2 text-xs text-surface-400">
            <li><Link to="/seller/dashboard" className="text-brand-400 font-semibold hover:underline">Seller Central Portal</Link></li>
            <li><Link to="/seller/products/new" className="hover:text-white transition-colors">List New Product</Link></li>
            <li><Link to="/admin/dashboard" className="text-purple-400 font-semibold hover:underline">Admin Operations Console</Link></li>
            <li><Link to="/customer/orders" className="hover:text-white transition-colors">Live Order Tracking</Link></li>
            <li><Link to="/help/seller-guide" className="hover:text-white transition-colors">Seller Policies & Fees</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Customer Support</h4>
          <ul className="space-y-2 text-xs text-surface-400">
            <li><Link to="/help" className="hover:text-white transition-colors">Help Center & FAQ</Link></li>
            <li><Link to="/customer/orders" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
            <li><Link to="/shipping-info" className="hover:text-white transition-colors">Shipping Rates & Policy</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy & Terms</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Concierge</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal & Payment Icons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500">
        <p>© 2026 ShopSphere Global Inc. All rights reserved.</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-surface-800 px-2.5 py-1 rounded-md text-3xs font-semibold text-surface-300">
            <CreditCard className="h-3.5 w-3.5 text-brand-400" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
