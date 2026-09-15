export interface PlatformStats {
  grossMerchandiseValue: number;
  gmvGrowthPercentage: number;
  totalPlatformRevenue: number;
  revenueGrowthPercentage: number;
  totalOrders: number;
  ordersGrowthPercentage: number;
  totalCustomers: number;
  customerGrowthPercentage: number;
  totalActiveSellers: number;
  pendingSellerApprovals: number;
  totalListedProducts: number;
  pendingProductApprovals: number;
  disputedOrdersCount: number;
  averageCustomerRating: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actorEmail: string;
  action: string;      // e.g. "USER_BANNED", "PRODUCT_APPROVED", "REFUND_ISSUED"
  resourceType: string;// e.g. "product", "seller", "user", "order", "coupon"
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface PlatformSettings {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  taxRatePercentage: number;
  standardShippingFee: number;
  freeShippingThreshold: number;
  defaultCommissionRate: number;
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  enableUserRegistration: boolean;
  enableSellerRegistration: boolean;
  maxUploadSizeMb: number;
  refundWindowDays: number;
  autoApproveSellerProducts: boolean;
}

export interface DisputeCase {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  reason: string;
  description: string;
  amount: number;
  status: 'open' | 'under_review' | 'resolved_refunded' | 'resolved_seller_favor' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}
