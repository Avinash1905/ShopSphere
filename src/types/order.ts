import { Address } from './common';
import { Product, ProductVariant } from './product';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'upi' | 'netbanking' | 'cod' | 'wallet';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  sellerName: string;
  productTitle: string;
  productImage: string;
  sku: string;
  attributes?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface TrackingEvent {
  id: string;
  timestamp: string;
  status: OrderStatus;
  title: string;
  description: string;
  location: string;
  carrierName?: string;
  trackingNumber?: string;
}

export interface PaymentDetails {
  method: PaymentMethodType;
  transactionId: string;
  status: PaymentStatus;
  paidAt?: string;
  cardLastFour?: string;
  cardBrand?: string;
  upiId?: string;
  bankName?: string;
  amount: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  sellerId: string;
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'size_fit' | 'changed_mind' | 'arrived_late';
  detailedReason: string;
  status: 'requested' | 'approved' | 'rejected' | 'pickup_scheduled' | 'item_received' | 'refunded';
  refundAmount: number;
  refundMethod: 'original_payment' | 'wallet_credit';
  photos: string[];
  createdAt: string;
  resolvedAt?: string;
  sellerNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-2026-98124"
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  shippingCarrier: string;
  shippingTrackingNumber?: string;
  estimatedDeliveryDate: string;
  deliveredAt?: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  payment: PaymentDetails;
  trackingEvents: TrackingEvent[];
  cancelReason?: string;
  cancelledAt?: string;
  notes?: string;
  returnRequests?: ReturnRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  order: Order;
  companyDetails: {
    name: string;
    address: string;
    taxId: string;
    email: string;
    phone: string;
    website: string;
  };
}
