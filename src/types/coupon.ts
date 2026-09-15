export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

export type CouponStatus = 'active' | 'scheduled' | 'expired' | 'disabled';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponType;
  discountValue: number; // e.g. 15 for 15% or 20 for $20
  minimumOrderAmount: number;
  maximumDiscountAmount?: number; // max cap for percentage discounts
  startDate: string;
  endDate: string;
  usageLimitPerUser: number;
  totalUsageLimit: number;
  timesUsed: number;
  status: CouponStatus;
  sellerId?: string; // If undefined, applies globally
  sellerName?: string;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
  isGlobal: boolean;
  createdAt: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  errorMessage?: string;
}
