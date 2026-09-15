import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSearchStore } from '../../store/searchStore';
import { MegaMenu } from './MegaMenu';
import {
  ShoppingBag,
  Heart,
  Search,
  Bell,
  User,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Package,
  Store,
  ShieldAlert,
  Settings,
  X,
} from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { summary, openCartDrawer } = useCartStore();
  const { wishlist } = useWishlistStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { query, setQuery, suggestions, addRecent } = useSearchStore();

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addRecent(query);
      setShowSearchSuggestions(false);
      navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Category trigger */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-surface-900 font-sans">
                  Shop<span className="text-brand-600">Sphere</span>
                </span>
                <span className="text-3xs uppercase font-bold tracking-widest text-surface-400 -mt-1">
                  Premier Market
                </span>
              </div>
            </Link>

            {/* MegaMenu Dropdown Button */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-surface-200 bg-surface-50 text-surface-700 text-xs font-semibold hover:bg-surface-100 hover:text-surface-900 transition-colors"
              >
                <LayoutGrid className="h-4 w-4 text-brand-600" />
                <span>Categories</span>
                <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
              </button>
            </div>
          </div>

          {/* Search Bar with Live Suggestions */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl relative hidden md:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  placeholder="Search 10,000+ products, electronics, sneakers, brands..."
                  className="w-full rounded-full border border-surface-300 bg-surface-50/80 pl-11 pr-24 py-2.5 text-xs text-surface-900 placeholder-surface-400 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-2xs"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-20 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 px-4 py-1.5 text-2xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-brand-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Suggestions Dropdown */}
            {showSearchSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-surface-200 p-2 z-50 animate-slide-down">
                <div className="px-3 py-1.5 text-3xs font-bold uppercase tracking-wider text-surface-400">
                  Instant Suggestions
                </div>
                {suggestions.map((item, index) => (
                  <Link
                    key={index}
                    to={item.url}
                    onClick={() => setShowSearchSuggestions(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-surface-700 hover:bg-surface-50 hover:text-brand-600 transition-colors"
                  >
                    <span className="font-medium line-clamp-1">{item.text}</span>
                    <span className="text-3xs uppercase font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-md">
                      {item.type}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Icons (Wishlist, Notifications, Cart, User) */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-surface-600 hover:bg-surface-100 hover:text-rose-600 transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute 1.5 top-1.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-3xs font-bold text-white shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Notifications Dropdown */}
            <div ref={notifMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-3xs font-bold text-white shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-3 shadow-2xl border border-surface-200 z-50 animate-slide-down">
                  <div className="flex items-center justify-between border-b border-surface-100 pb-2 px-2">
                    <h5 className="text-xs font-bold text-surface-900">Notifications</h5>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-2xs font-semibold text-brand-600 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-surface-100 max-h-72 overflow-y-auto mt-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-surface-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.link) navigate(n.link);
                            setIsNotifOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                            n.isRead ? 'hover:bg-surface-50' : 'bg-brand-50/50 hover:bg-brand-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-surface-900 leading-snug">
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="h-2 w-2 rounded-full bg-brand-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-2xs text-surface-600 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-surface-100 pt-2 text-center">
                    <Link
                      to="/customer/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-2xs font-bold text-brand-600 hover:underline"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              type="button"
              onClick={openCartDrawer}
              className="flex items-center gap-2.5 rounded-xl bg-brand-50 px-3.5 py-2 text-brand-700 hover:bg-brand-100 transition-colors"
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-brand-600" />
                {summary.totalQuantity > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-3xs font-bold text-white shadow-sm">
                    {summary.totalQuantity}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-3xs uppercase font-bold text-brand-600">Cart</span>
                <span className="text-xs font-extrabold text-brand-900 -mt-0.5">
                  ${summary.grandTotal.toFixed(2)}
                </span>
              </div>
            </button>

            {/* User Account / Profile Menu */}
            <div ref={userMenuRef} className="relative">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface-100 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center overflow-hidden border border-brand-200">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      user.fullName.charAt(0)
                    )}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-surface-500 hidden sm:block" />
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-surface-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-surface-800 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* User Dropdown Menu */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-surface-200 z-50 animate-slide-down">
                  <div className="px-3 py-2 border-b border-surface-100">
                    <p className="text-xs font-bold text-surface-900">{user.fullName}</p>
                    <p className="text-2xs text-surface-500 truncate">{user.email}</p>
                    <span className="mt-1 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-3xs font-bold uppercase text-brand-700">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5 text-xs text-surface-700">
                    <Link
                      to="/customer/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-50 hover:text-brand-600 transition-colors"
                    >
                      <User className="h-4 w-4" /> Profile & Addresses
                    </Link>
                    <Link
                      to="/customer/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-50 hover:text-brand-600 transition-colors"
                    >
                      <Package className="h-4 w-4" /> Order History
                    </Link>

                    {user.role === 'seller' && (
                      <Link
                        to="/seller/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50/60 font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
                      >
                        <Store className="h-4 w-4" /> Seller Dashboard
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <ShieldAlert className="h-4 w-4" /> Admin Console
                      </Link>
                    )}

                    <Link
                      to="/customer/profile/security"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-50 hover:text-brand-600 transition-colors"
                    >
                      <Settings className="h-4 w-4" /> Security & 2FA
                    </Link>
                  </div>

                  <div className="border-t border-surface-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-danger-600 hover:bg-danger-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MegaMenu Popover */}
      <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
    </header>
  );
};
