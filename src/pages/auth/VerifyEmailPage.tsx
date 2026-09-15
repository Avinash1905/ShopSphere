import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-surface-200 shadow-xl shadow-surface-200/50 text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-11 w-11 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-surface-900">
            Shop<span className="text-brand-600">Sphere</span>
          </span>
        </Link>

        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 mx-auto shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-surface-900">Email Verified Successfully!</h2>
          <p className="text-xs text-surface-600 leading-relaxed">
            Your email address has been verified. You now have full access to premier orders, seller tools, and member discounts.
          </p>
        </div>

        <Link
          to="/"
          className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <span>Explore ShopSphere</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
