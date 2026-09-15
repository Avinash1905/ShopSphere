import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../schemas/authSchemas';
import { authService } from '../../services';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { ShoppingBag, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.requestPasswordReset(data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-xl font-bold text-surface-900">Reset your password</h2>
          <p className="text-xs text-surface-500">
            Enter your account email to receive a secure password reset link.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {isSubmitted ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-surface-900">Reset Link Dispatched!</h4>
              <p className="text-xs text-surface-600 leading-relaxed">
                If an account matches that email, we've sent password reset instructions. Please check your inbox and spam folder.
              </p>
            </div>
            <Link
              to="/auth/login"
              className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold block text-center"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Account Email"
              type="email"
              placeholder="alex@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full rounded-xl py-3 font-bold"
            >
              Send Reset Instructions
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-600 hover:text-surface-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
