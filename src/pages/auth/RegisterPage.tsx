import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '../../schemas/authSchemas';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { ShoppingBag, User, Mail, Lock, Phone, Eye, EyeOff, Store, ShoppingCart } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUiStore();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller'>('customer');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'customer',
      acceptTerms: true,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      addToast({
        type: 'success',
        title: 'Account Created! 🎉',
        message: 'Welcome to the ShopSphere community.',
      });
      if (data.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    } catch {
      // error handled in store
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
          <h2 className="text-xl font-bold text-surface-900">Create your account</h2>
          <p className="text-xs text-surface-500">
            Join thousands of shoppers and premier multi-vendor merchants.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-surface-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('customer');
              setValue('role', 'customer');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'customer'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-900'
            }`}
          >
            <ShoppingCart className="h-4 w-4 text-brand-600" />
            <span>I'm a Customer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('seller');
              setValue('role', 'seller');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'seller'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-900'
            }`}
          >
            <Store className="h-4 w-4 text-emerald-600" />
            <span>I'm a Seller</span>
          </button>
        </div>

        {error && (
          <Alert variant="danger" onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Alex Morgan"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="alex@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            placeholder="+1 (555) 000-0000"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters (1 uppercase, 1 number)"
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

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="pt-2">
            <Checkbox
              label={
                <span className="text-xs text-surface-600">
                  I agree to the{' '}
                  <Link to="/terms" className="font-semibold text-brand-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-semibold text-brand-600 hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              }
              error={errors.acceptTerms?.message}
              {...register('acceptTerms')}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full rounded-xl py-3 font-bold mt-4"
          >
            Create {selectedRole === 'seller' ? 'Seller Account' : 'Customer Account'}
          </Button>
        </form>

        {/* Login footer */}
        <div className="text-center text-xs text-surface-500 pt-2 border-t border-surface-100">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-bold text-brand-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
