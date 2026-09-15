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
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  actorEmail?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt?: string;
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
