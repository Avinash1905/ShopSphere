import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSellerStore } from '../store/sellerStore';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  RotateCcw,
  Tag,
  BarChart3,
  DollarSign,
  Store,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const SELLER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/seller/products', icon: Package },
  { label: 'Inventory', path: '/seller/inventory', icon: Boxes },
  { label: 'Orders', path: '/seller/orders', icon: ShoppingBag, badge: '5 New' },
  { label: 'Returns & Refunds', path: '/seller/returns', icon: RotateCcw },
  { label: 'Store Coupons', path: '/seller/coupons', icon: Tag },
  { label: 'Analytics', path: '/seller/analytics', icon: BarChart3 },
  { label: 'Payouts & Balance', path: '/seller/payouts', icon: DollarSign },
  { label: 'Store Settings', path: '/seller/settings', icon: Settings },
];

export const SellerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentSeller } = useSellerStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/seller/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                  ShopSphere
                </span>
                <Badge variant="primary" size="sm">Seller Hub</Badge>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">
                {currentSeller?.storeName || 'Aura Sound Technologies'}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header Utilities */}
        <div className="flex items-center gap-3">
          <Link
            to="/catalog"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span>Live Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* User Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Avatar
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.name || 'Seller'}
                size="sm"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline-block">
                {user?.name || 'Alex Morgan'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/seller/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="block px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Store Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body Layout */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
            sidebarOpen ? 'translate-x-0 pt-16 lg:pt-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 space-y-1 overflow-y-auto h-full">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Seller Operations
            </span>
            {SELLER_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
