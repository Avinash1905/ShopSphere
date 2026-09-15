import { Product, ProductVariant } from './product';

export interface CartItem {
  id: string; // Unique cart item ID (typically productId + variantId)
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedAttributes?: Record<string, string>;
  isAvailable: boolean;
  maxAvailableQuantity: number;
  addedAt: string;
}

export interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  discountAmount: number;
  description: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  description: string;
  estimatedDays: string;
  cost: number;
  isFreeThreshold?: number;
}

export interface CartSummary {
  itemsCount: number;
  totalQuantity: number;
  subtotal: number;
  discountAmount: number;
  appliedCoupon?: AppliedCoupon | null;
  taxAmount: number;
  estimatedShipping: number;
  grandTotal: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
}

export interface SavedForLaterItem {
  id: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  savedAt: string;
}
