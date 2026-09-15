import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ShoppingBag, ArrowLeft, Search, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Graphic */}
        <div className="relative">
          <span className="text-8xl sm:text-9xl font-black text-slate-200 dark:text-slate-800 tracking-tighter select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30">
              <ShoppingBag className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Page Not Discovered
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            The destination you requested might have been moved, renamed, or is temporarily out of service.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Link to="/" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2">
              <Home className="w-4 h-4" /> Return to Homepage
            </Button>
          </Link>
          <Link to="/catalog" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full gap-2">
              <Search className="w-4 h-4" /> Browse Catalog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
