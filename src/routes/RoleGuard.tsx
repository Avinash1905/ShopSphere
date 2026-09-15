import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Access Restricted (403)
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account with role <b className="text-indigo-400 font-mono">[{user.role.toUpperCase()}]</b> does not possess the requisite clearance to access this platform module.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="outline" className="w-full text-slate-300 border-slate-700">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Return Home
              </Button>
            </Link>
            {user.role === 'seller' ? (
              <Link to="/seller/dashboard">
                <Button className="w-full">Seller Dashboard</Button>
              </Link>
            ) : user.role === 'admin' ? (
              <Link to="/admin/dashboard">
                <Button className="w-full">Admin Dashboard</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
