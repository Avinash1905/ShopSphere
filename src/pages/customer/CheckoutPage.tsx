import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { CheckoutStepper } from '../../features/checkout/CheckoutStepper';
import { AddressStep } from '../../features/checkout/AddressStep';
import { ShippingStep } from '../../features/checkout/ShippingStep';
import { PaymentStep } from '../../features/checkout/PaymentStep';
import { OrderReviewStep } from '../../features/checkout/OrderReviewStep';
import { CartSummaryCard } from '../../features/cart/CartSummaryCard';
import { Address, ShippingMethod, PaymentMethod, CheckoutStep } from '../../types';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const {
    currentStep,
    shippingAddress,
    shippingMethod,
    paymentMethod,
    isProcessing,
    setStep,
    setShippingAddress,
    setShippingMethod,
    setPaymentMethod,
    setProcessing,
    resetCheckout,
  } = useCheckoutStore();
  const { placeOrder } = useOrderStore();

  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);

  useEffect(() => {
    // If cart is empty, redirect back to cart
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleSelectAddress = (addr: Address) => {
    setShippingAddress(addr);
  };

  const handleProceedFromAddress = () => {
    if (!shippingAddress) return;
    if (!completedSteps.includes('address')) {
      setCompletedSteps((prev) => [...prev, 'address']);
    }
    setStep('shipping');
  };

  const handleSelectShipping = (method: ShippingMethod) => {
    setShippingMethod(method);
  };

  const handleProceedFromShipping = () => {
    if (!shippingMethod) return;
    if (!completedSteps.includes('shipping')) {
      setCompletedSteps((prev) => [...prev, 'shipping']);
    }
    setStep('payment');
  };

  const handleSelectPayment = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleProceedFromPayment = () => {
    if (!paymentMethod) return;
    if (!completedSteps.includes('payment')) {
      setCompletedSteps((prev) => [...prev, 'payment']);
    }
    setStep('review');
  };

  const handleFinalPlaceOrder = async () => {
    if (!shippingAddress || !shippingMethod || !paymentMethod || !cart) return;

    setProcessing(true);
    try {
      const order = await placeOrder({
        items: cart.items,
        shippingAddress,
        billingAddress: shippingAddress,
        shippingMethod,
        paymentMethod,
        subtotal: cart.subtotal,
        discount: cart.discount,
        tax: cart.tax,
        shippingFee: shippingMethod.price,
        total: cart.subtotal - cart.discount + cart.tax + shippingMethod.price,
        couponCode: cart.coupon?.code,
      });

      // Clear checkout state & cart
      resetCheckout();
      await clearCart();

      // Navigate to success page
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      console.error('Order placement failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const shippingFee = shippingMethod ? shippingMethod.price : 4.99;
  const grandTotal = cart.subtotal - cart.discount + cart.tax + shippingFee;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Secure Checkout
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Complete your order with end-to-end encrypted guarantee.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full w-fit">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Stepper */}
        <CheckoutStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={(step) => setStep(step)}
        />

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Active Step Panel */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {currentStep === 'address' && (
              <AddressStep
                selectedAddressId={shippingAddress?.id || null}
                onSelectAddress={handleSelectAddress}
                onProceed={handleProceedFromAddress}
              />
            )}

            {currentStep === 'shipping' && (
              <ShippingStep
                selectedShippingId={shippingMethod?.id || null}
                onSelectShipping={handleSelectShipping}
                onProceed={handleProceedFromShipping}
                onBack={() => setStep('address')}
              />
            )}

            {currentStep === 'payment' && (
              <PaymentStep
                selectedPaymentMethod={paymentMethod}
                onSelectPayment={handleSelectPayment}
                onProceed={handleProceedFromPayment}
                onBack={() => setStep('shipping')}
                orderTotal={grandTotal}
              />
            )}

            {currentStep === 'review' && (
              <OrderReviewStep
                items={cart.items}
                shippingAddress={shippingAddress}
                shippingMethod={shippingMethod}
                paymentMethod={paymentMethod}
                subtotal={cart.subtotal}
                discount={cart.discount}
                tax={cart.tax}
                shippingFee={shippingFee}
                total={grandTotal}
                isSubmitting={isProcessing}
                onPlaceOrder={handleFinalPlaceOrder}
                onBack={() => setStep('payment')}
              />
            )}
          </div>

          {/* Persistent Order Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <CartSummaryCard
              subtotal={cart.subtotal}
              discount={cart.discount}
              tax={cart.tax}
              shipping={shippingFee}
              total={grandTotal}
              appliedCoupon={cart.coupon}
              onCheckout={() => {}}
              hideCheckoutButton
            />

            <div className="bg-slate-100/70 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>ShopSphere Buyer Protection</span>
              </div>
              <p>
                Get a full refund if your items do not arrive or are significantly not as described.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
