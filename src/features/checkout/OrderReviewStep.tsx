import React from 'react';
import { Address, ShippingMethod, CartItem, PaymentMethod } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import { MapPin, Truck, CreditCard, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface OrderReviewStepProps {
  items: CartItem[];
  shippingAddress: Address | null;
  shippingMethod: ShippingMethod | null;
  paymentMethod: PaymentMethod | null;
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  isSubmitting: boolean;
  onPlaceOrder: () => void;
  onBack: () => void;
}

export const OrderReviewStep: React.FC<OrderReviewStepProps> = ({
  items,
  shippingAddress,
  shippingMethod,
  paymentMethod,
  subtotal,
  discount,
  tax,
  shippingFee,
  total,
  isSubmitting,
  onPlaceOrder,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review & Confirm Order</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please verify your details and order items before finalizing your purchase.
        </p>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shipping Address */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>Shipping Destination</span>
          </div>
          {shippingAddress ? (
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-200">
                {shippingAddress.fullName}
              </p>
              <p>{shippingAddress.street} {shippingAddress.apartment}</p>
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.phone}</p>
            </div>
          ) : (
            <p className="text-xs text-rose-500">No address selected</p>
          )}
        </Card>

        {/* Shipping Method */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>Delivery Method</span>
          </div>
          {shippingMethod ? (
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-200">
                {shippingMethod.name}
              </p>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                ETA: {shippingMethod.estimatedDays}
              </p>
              <p>{shippingMethod.carrier}</p>
              <p className="font-semibold text-slate-900 dark:text-slate-200">
                ${shippingMethod.price.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-rose-500">No shipping selected</p>
          )}
        </Card>

        {/* Payment Method */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Payment Method</span>
          </div>
          {paymentMethod ? (
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {(typeof paymentMethod === 'string' ? paymentMethod : (paymentMethod as any)?.type || 'CARD').toUpperCase()}
                </Badge>
              </div>
              <p className="font-medium text-slate-900 dark:text-slate-200 capitalize">
                {typeof paymentMethod === 'string'
                  ? paymentMethod.replace('_', ' ')
                  : (paymentMethod as any)?.type === 'card'
                  ? `${(paymentMethod as any)?.details?.cardBrand || 'Card'} ending in ${(paymentMethod as any)?.details?.last4 || '4242'}`
                  : (paymentMethod as any)?.type === 'upi'
                  ? `UPI ID: ${(paymentMethod as any)?.details?.upiId || 'user@upi'}`
                  : (paymentMethod as any)?.type === 'netbanking'
                  ? `Bank: ${(paymentMethod as any)?.details?.bankName || 'Standard Bank'}`
                  : 'Cash on Delivery'}
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
              </p>
            </div>
          ) : (
            <p className="text-xs text-rose-500">No payment method</p>
          )}
        </Card>
      </div>

      {/* Items Review */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Items in your shipment ({items.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.product.images[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Seller: <span className="font-medium text-slate-700 dark:text-slate-300">{item.product.sellerName}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Qty: <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <PriceDisplay
                  price={(item.variant?.price || item.unitPrice || item.product.price) * item.quantity}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <Card className="p-5 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <PriceDisplay price={subtotal} size="sm" />
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Applied Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Shipping</span>
            <span>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Estimated Tax (8%)</span>
            <PriceDisplay price={tax} size="sm" />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center text-base font-bold text-slate-900 dark:text-white">
            <span>Total Payable</span>
            <PriceDisplay price={total} size="lg" />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Payment
        </Button>
        <Button
          size="lg"
          onClick={onPlaceOrder}
          isLoading={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px] shadow-lg shadow-emerald-600/20"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" /> Place Order Now
        </Button>
      </div>
    </div>
  );
};
