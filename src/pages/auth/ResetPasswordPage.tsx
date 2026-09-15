import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormData } from '../../schemas/authSchemas';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShoppingBag, Lock, Eye, EyeOff } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (_data: ResetPasswordFormData) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'success',
        title: 'Password Updated!',
        message: 'Your password has been changed. Please sign in.',
      });
      navigate('/auth/login');
    }, 500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-surface-200 shadow-xl shadow-surface-200/50">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-11 w-11 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-surface-900">
              Shop<span className="text-brand-600">Sphere</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-surface-900">Choose a new password</h2>
          <p className="text-xs text-surface-500">
            Create a strong, secure password with at least 8 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="New Password"
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
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full rounded-xl py-3 font-bold"
          >
            Update Password & Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};
