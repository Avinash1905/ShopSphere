import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Store,
  PackageCheck,
  FolderTree,
  Tag,
  MessageSquare,
  Scale,
  ScrollText,
  Sliders,
  LogOut,
  Menu,
  X,
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

const ADMIN_NAV: NavItem[] = [
  { label: 'Executive Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Seller Directory', path: '/admin/sellers', icon: Store },
  { label: 'Seller KYC Approvals', path: '/admin/seller-approvals', icon: ShieldCheck, badge: '3 Pending' },
  { label: 'Product Approvals', path: '/admin/product-approvals', icon: PackageCheck, badge: '12 New' },
  { label: 'Categories & Taxonomy', path: '/admin/categories', icon: FolderTree },
  { label: 'Platform Coupons', path: '/admin/coupons', icon: Tag },
  { label: 'Review Moderation', path: '/admin/reviews', icon: MessageSquare },
  { label: 'Dispute Arbitration', path: '/admin/disputes', icon: Scale, badge: '1 Open' },
  { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
  { label: 'Platform Settings', path: '/admin/settings', icon: Sliders },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-tight">
                  ShopSphere
                </span>
                <Badge variant="danger" size="sm">SUPER ADMIN</Badge>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block leading-none">
                Platform Control Center v2.4
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header Utilities */}
        <div className="flex items-center gap-4">
          <Link
            to="/catalog"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <span>Live Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* User Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Avatar
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.name || 'Admin'}
                size="sm"
              />
              <span className="text-xs font-bold text-slate-200 hidden sm:inline-block">
                {user?.name || 'Root Administrator'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="block px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Platform Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
            sidebarOpen ? 'translate-x-0 pt-16 lg:pt-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 space-y-1 overflow-y-auto h-full">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Platform Administration
            </span>
            {ADMIN_NAV.map((item) => {
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
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
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
                          : 'bg-rose-950 text-rose-400 border border-rose-800/50'
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

        {/* Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
