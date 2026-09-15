import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../schemas/authSchemas';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { ShoppingBag, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, Store, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const { login, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUiStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'customer@shopsphere.com',
      password: 'password123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'You have signed in successfully.',
      });
      navigate(from, { replace: true });
    } catch {
      // error handled in store
    }
  };

  const handleQuickFill = (role: 'customer' | 'seller' | 'admin') => {
    clearError();
    if (role === 'customer') {
      setValue('email', 'customer@shopsphere.com');
      setValue('password', 'password123');
    } else if (role === 'seller') {
      setValue('email', 'seller@shopsphere.com');
      setValue('password', 'password123');
    } else {
      setValue('email', 'admin@shopsphere.com');
      setValue('password', 'password123');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-surface-200 shadow-xl shadow-surface-200/50">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-11 w-11 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-surface-900">
              Shop<span className="text-brand-600">Sphere</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-surface-900">Sign in to your account</h2>
          <p className="text-xs text-surface-500">
            Welcome back! Access orders, wishlist, seller tools, or admin controls.
          </p>
        </div>

        {/* Demo Quick Fills */}
        <div className="space-y-2 bg-surface-50 p-3.5 rounded-2xl border border-surface-200">
          <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-surface-500">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
            <span>Demo Portal Fast-Login:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('customer')}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-surface-200 text-2xs font-bold text-surface-700 hover:border-brand-500 hover:text-brand-600 shadow-2xs transition-colors"
            >
              <UserCheck className="h-3 w-3 text-brand-600" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('seller')}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-surface-200 text-2xs font-bold text-surface-700 hover:border-brand-500 hover:text-brand-600 shadow-2xs transition-colors"
            >
              <Store className="h-3 w-3 text-emerald-600" />
              <span>Seller</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-surface-200 text-2xs font-bold text-surface-700 hover:border-brand-500 hover:text-brand-600 shadow-2xs transition-colors"
            >
              <Shield className="h-3 w-3 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer text-surface-400 hover:text-surface-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              {...register('rememberMe')}
            />
            <Link
              to="/auth/forgot-password"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full rounded-xl py-3 font-bold"
          >
            Sign In to ShopSphere
          </Button>
        </form>

        {/* Register footer */}
        <div className="text-center text-xs text-surface-500 pt-2 border-t border-surface-100">
          Don't have an account yet?{' '}
          <Link to="/auth/register" className="font-bold text-brand-600 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
