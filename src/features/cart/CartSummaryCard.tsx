import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartSummary } from '../../types';
import { Tag, ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export interface CartSummaryCardProps {
  summary: CartSummary;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
  isLoading?: boolean;
}

export const CartSummaryCard: React.FC<CartSummaryCardProps> = ({
  summary,
  onApplyCoupon,
  onRemoveCoupon,
  isLoading = false,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-2xs">
      <h3 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-4">
        Order Summary
      </h3>

      {/* Free Shipping Gauge */}
      <div className="rounded-2xl bg-brand-50/70 p-4 border border-brand-100 space-y-2">
        <div className="flex justify-between text-2xs font-semibold text-brand-900">
          <span>
            {summary.amountNeededForFreeShipping === 0
              ? '🎉 Free Shipping Unlocked!'
              : `Add $${summary.amountNeededForFreeShipping.toFixed(2)} more for Free Shipping`}
          </span>
          <span>${summary.freeShippingThreshold} threshold</span>
        </div>
        <div className="h-2 w-full bg-brand-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{
              width: `${Math.min(
                100,
                ((summary.freeShippingThreshold - summary.amountNeededForFreeShipping) /
                  summary.freeShippingThreshold) *
                  100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Promo Code Input */}
      <div className="space-y-2">
        <label className="block text-2xs font-bold uppercase tracking-wider text-surface-600">
          Promotional Code
        </label>
        {summary.appliedCoupon ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                <strong className="font-bold">{summary.appliedCoupon.code}</strong> applied (-${summary.discountAmount.toFixed(2)})
              </span>
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="p-1 text-surface-400 hover:text-danger-600 transition-colors"
              title="Remove coupon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApply} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
                className="w-full rounded-xl border border-surface-300 pl-9 pr-3 py-2 text-xs uppercase font-mono text-surface-900 focus:border-brand-500 focus:outline-none"
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={isLoading}
              className="rounded-xl px-4 text-xs font-bold"
            >
              Apply
            </Button>
          </form>
        )}
        {couponError && <p className="text-2xs text-danger-600 font-medium">{couponError}</p>}
      </div>

      {/* Calculations Breakdown */}
      <div className="space-y-3 text-xs border-t border-surface-100 pt-4 text-surface-600">
        <div className="flex justify-between">
          <span>Subtotal ({summary.totalQuantity} items)</span>
          <span className="font-semibold text-surface-900">${summary.subtotal.toFixed(2)}</span>
        </div>

        {summary.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>Coupon Discount</span>
            <span>-${summary.discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Estimated Shipping</span>
          <span className="font-semibold text-surface-900">
            {summary.estimatedShipping === 0 ? (
              <span className="text-emerald-600 uppercase text-3xs font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                Free
              </span>
            ) : (
              `$${summary.estimatedShipping.toFixed(2)}`
            )}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Estimated Tax (8.5%)</span>
          <span className="font-semibold text-surface-900">${summary.taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-baseline justify-between border-t border-surface-200 pt-3 text-base font-black text-surface-900">
          <span>Grand Total</span>
          <span className="text-xl font-black text-brand-600">
            ${summary.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout CTA */}
      <Link
        to="/checkout"
        className="btn-primary w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-brand-500/20"
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="h-4 w-4" />
      </Link>

      <div className="flex items-center justify-center gap-2 text-3xs text-surface-400 font-medium pt-1">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>256-Bit Encrypted & Verified Safe Checkout</span>
      </div>
    </div>
  );
};
