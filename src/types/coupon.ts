export type CouponType = 'percentage' | 'fixed_amount' | 'fixed' | 'free_shipping';

export type CouponStatus = 'active' | 'scheduled' | 'expired' | 'disabled';

export interface Coupon {
  id: string;
  code: string;
  title?: string;
  description?: string;
  discountType?: CouponType;
  type?: any;
  discountValue?: number;
  value?: number;
  minimumOrderAmount?: number;
  minPurchase?: number;
  maximumDiscountAmount?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimitPerUser?: number;
  totalUsageLimit?: number;
  usageLimit?: number;
  timesUsed?: number;
  usedCount?: number;
  status?: CouponStatus;
  isActive?: boolean;
  sellerId?: string;
  sellerName?: string;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
  isGlobal?: boolean;
  createdAt?: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  errorMessage?: string;
}
