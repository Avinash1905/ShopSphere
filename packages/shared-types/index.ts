/**
 * ShopSphere Shared Enterprise Domain Types & DTOs
 * Provides canonical data contracts across Frontend, Backend, Systems, and Database.
 */

export type UserRole = 'customer' | 'seller' | 'admin' | 'super_admin' | 'moderator' | 'support_agent';
export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'deactivated';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface UserProfile extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CustomerProfile extends BaseEntity {
  userId: string;
  loyaltyPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  totalOrders: number;
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  preferences: {
    newsletter: boolean;
    smsAlerts: boolean;
    orderUpdates: boolean;
    currency: string;
    language: string;
  };
}

export interface SellerProfile extends BaseEntity {
  userId: string;
  storeName: string;
  storeSlug: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessAddress: string;
  taxId: string;
  commissionRate: number;
  rating: number;
  reviewCount: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  payoutBalance: number;
  kycStatus: 'pending' | 'verified' | 'rejected' | 'in_review';
  bankDetails: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    accountHolderName: string;
  };
}

export interface ProductCategory extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  imageUrl?: string;
  parentId?: string;
  level: number;
  order: number;
  isActive: boolean;
  subcategories?: ProductCategory[];
}

export interface ProductBrand extends BaseEntity {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  isFeatured: boolean;
  totalProducts: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  inventoryQuantity: number;
  barcode?: string;
  weightGrams?: number;
  options: {
    name: string;
    value: string;
  }[];
  imageUrl?: string;
  isActive: boolean;
}

export interface ProductListing extends BaseEntity {
  sellerId: string;
  sellerName: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  basePrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isApproved: boolean;
  status: 'draft' | 'pending_approval' | 'published' | 'archived' | 'rejected';
  images: string[];
  thumbnailUrl: string;
  tags: string[];
  variants: ProductVariant[];
  attributes: {
    key: string;
    value: string;
  }[];
  specifications: {
    group: string;
    items: {
      name: string;
      value: string;
    }[];
  }[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURNED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'upi' | 'netbanking' | 'cod' | 'wallet';
export type PaymentStatusType = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
  fulfillmentStatus: 'unfulfilled' | 'allocated' | 'packed' | 'shipped' | 'delivered' | 'returned';
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: 'home' | 'office' | 'work' | 'other';
  isDefault?: boolean;
}

export interface OrderEntity extends BaseEntity {
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  paymentTransactionId?: string;
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  cancelReason?: string;
  notes?: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    description: string;
    location?: string;
  }[];
}

export interface CouponEntity extends BaseEntity {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  sellerId?: string;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
}

export interface ReviewEntity extends BaseEntity {
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'flagged' | 'rejected';
  helpfulVotes: number;
  images?: string[];
  sellerReply?: {
    comment: string;
    repliedAt: string;
  };
}

export interface AuditLogEntity extends BaseEntity {
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
