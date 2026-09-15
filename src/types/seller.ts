import { Address } from './common';

export type SellerStatus = 'pending_verification' | 'active' | 'suspended' | 'rejected';

export type SellerTier = 'starter' | 'silver' | 'gold' | 'platinum';

export type Seller = SellerProfile;

export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeSlug?: string;
  slug?: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  logo?: string;
  bannerUrl?: string;
  banner?: string;
  email?: string;
  phone?: string;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  status: SellerStatus;
  tier?: SellerTier;
  commissionRate?: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  totalSales?: number;
  totalOrders?: number;
  productCount?: number;
  joinedDate?: string;
  address?: Address;
  bankDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountType?: 'checking' | 'savings';
  };
  policies?: {
    shippingPolicy?: string;
    returnPolicy?: string;
    warrantyPolicy?: string;
  };
  createdAt?: string;
}

export interface SellerDashboardStats {
  todayRevenue?: number;
  todayRevenueChange?: number;
  totalRevenue?: number;
  totalSales?: number;
  totalOrders: number;
  pendingOrdersCount?: number;
  averageOrderValue?: number;
  conversionRate?: number;
  lowStockItemsCount?: number;
  outOfStockItemsCount?: number;
  customerRating?: number;
  returnRate?: number;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  payoutNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  grossAmount?: number;
  platformFee?: number;
  taxWithheld?: number;
  netAmount?: number;
  amount?: number;
  bankAccount?: string;
  date?: string;
  status: 'pending' | 'processing' | 'paid' | 'completed' | 'failed';
  processedAt?: string;
  paymentMethod?: string;
}

export interface SellerInventoryAlert {
  productId: string;
  variantId?: string;
  productTitle: string;
  sku: string;
  currentStock: number;
  reorderThreshold: number;
  status: 'low_stock' | 'out_of_stock';
}
