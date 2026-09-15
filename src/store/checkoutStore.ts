import { create } from 'zustand';
import { Address, ShippingOption, PaymentMethodType, Order } from '../types';
import { orderService, paymentService } from '../services';

export type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review' | 'confirmation';

interface CheckoutState {
  currentStep: CheckoutStep;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  sameBillingAddress: boolean;
  selectedShippingOption: ShippingOption | null;
  shippingMethod: any | null;
  paymentMethod: PaymentMethodType;
  cardDetails: any;
  upiId: string;
  bankCode: string;
  orderNotes: string;
  isProcessing: boolean;
  placedOrder: Order | null;
  error: string | null;

  setStep: (step: CheckoutStep) => void;
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address) => void;
  setSameBillingAddress: (same: boolean) => void;
  setSelectedShippingOption: (option: ShippingOption) => void;
  setShippingMethod: (method: any) => void;
  setPaymentMethod: (method: PaymentMethodType) => void;
  setCardDetails: (details: any) => void;
  setUpiId: (id: string) => void;
  setBankCode: (code: string) => void;
  setOrderNotes: (notes: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  processCheckout: (couponCode?: string) => Promise<Order>;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  currentStep: 'address',
  shippingAddress: null,
  billingAddress: null,
  sameBillingAddress: true,
  selectedShippingOption: null,
  shippingMethod: null,
  paymentMethod: 'credit_card',
  cardDetails: null,
  upiId: '',
  bankCode: '',
  orderNotes: '',
  isProcessing: false,
  placedOrder: null,
  error: null,

  setStep: (step) => set({ currentStep: step }),
  setShippingAddress: (address) => set({ shippingAddress: address }),
  setBillingAddress: (address) => set({ billingAddress: address }),
  setSameBillingAddress: (same) => set({ sameBillingAddress: same }),
  setSelectedShippingOption: (option) => set({ selectedShippingOption: option, shippingMethod: option }),
  setShippingMethod: (method) => set({ shippingMethod: method, selectedShippingOption: method }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCardDetails: (details) => set({ cardDetails: details }),
  setUpiId: (id) => set({ upiId: id }),
  setBankCode: (code) => set({ bankCode: code }),
  setOrderNotes: (notes) => set({ orderNotes: notes }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  processCheckout: async (couponCode) => {
    const {
      shippingAddress,
      billingAddress,
      sameBillingAddress,
      selectedShippingOption,
      paymentMethod,
      cardDetails,
      upiId,
      bankCode,
      orderNotes,
    } = get();

    if (!shippingAddress) throw new Error('Please select or provide a shipping address.');

    set({ isProcessing: true, error: null });

    try {
      // Step 1: Process payment simulation
      const paymentRes = await paymentService.processPayment({
        amount: 0, // calculated by order service
        method: paymentMethod,
        cardDetails,
        upiId,
        bankCode,
      });

      // Step 2: Create order
      const effectiveBillingAddress = sameBillingAddress ? shippingAddress : billingAddress || shippingAddress;

      const orderRes = await orderService.createOrder({
        shippingAddressId: shippingAddress.id,
        billingAddressId: effectiveBillingAddress.id,
        shippingOptionId: selectedShippingOption?.id || 'ship-standard',
        paymentDetails: paymentRes.data,
        couponCode,
        notes: orderNotes,
      });

      set({
        placedOrder: orderRes.data,
        currentStep: 'confirmation',
        isProcessing: false,
      });

      return orderRes.data;
    } catch (err: any) {
      set({ error: err.message || 'Payment processing failed', isProcessing: false });
      throw err;
    }
  },

  resetCheckout: () =>
    set({
      currentStep: 'address',
      shippingAddress: null,
      billingAddress: null,
      sameBillingAddress: true,
      selectedShippingOption: null,
      paymentMethod: 'credit_card',
      cardDetails: null,
      upiId: '',
      bankCode: '',
      orderNotes: '',
      isProcessing: false,
      placedOrder: null,
      error: null,
    }),
}));
