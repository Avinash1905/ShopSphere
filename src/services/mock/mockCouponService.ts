import { ICouponService } from '../api/couponService';
import { mockStorage } from './mockStorage';
import { Coupon, CouponValidationResult, ApiResponse } from '../../types';

export class MockCouponService implements ICouponService {
  async validateCoupon(code: string, cartTotal: number, categoryIds: string[] = []): Promise<ApiResponse<CouponValidationResult>> {
    await mockStorage.delay(200);
    const coupons = mockStorage.getCoupons();
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase().trim()
    );

    if (!coupon) {
      return {
        success: false,
        data: { isValid: false, errorMessage: 'Invalid or non-existent coupon code' },
      };
    }

    if (coupon.status !== 'active') {
      return {
        success: false,
        data: { isValid: false, errorMessage: 'This coupon is no longer active' },
      };
    }

    const now = new Date().toISOString();
    if (coupon.startDate > now) {
      return {
        success: false,
        data: { isValid: false, errorMessage: 'This coupon promotion has not started yet' },
      };
    }

    if (coupon.endDate < now) {
      return {
        success: false,
        data: { isValid: false, errorMessage: 'This coupon has expired' },
      };
    }

    if (cartTotal < coupon.minimumOrderAmount) {
      return {
        success: false,
        data: {
          isValid: false,
          errorMessage: `Minimum order amount of $${coupon.minimumOrderAmount} required to use this voucher`,
        },
      };
    }

    if (coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0) {
      const hasMatchingCategory = categoryIds.some((id) => coupon.applicableCategoryIds!.includes(id));
      if (!hasMatchingCategory && categoryIds.length > 0) {
        return {
          success: false,
          data: {
            isValid: false,
            errorMessage: 'This coupon is not valid for the items in your cart',
          },
        };
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      const raw = (cartTotal * coupon.discountValue) / 100;
      discountAmount = coupon.maximumDiscountAmount
        ? Math.min(raw, coupon.maximumDiscountAmount)
        : raw;
    } else if (coupon.discountType === 'fixed_amount') {
      discountAmount = Math.min(coupon.discountValue, cartTotal);
    } else if (coupon.discountType === 'free_shipping') {
      discountAmount = 14.99;
    }

    return {
      success: true,
      data: {
        isValid: true,
        coupon,
        discountAmount: Number(discountAmount.toFixed(2)),
      },
    };
  }

  async getAvailableCoupons(): Promise<ApiResponse<Coupon[]>> {
    await mockStorage.delay(150);
    const coupons = mockStorage.getCoupons().filter((c) => c.status === 'active' && c.isGlobal);
    return { success: true, data: coupons };
  }

  async createCoupon(couponData: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    await mockStorage.delay(300);
    const coupons = mockStorage.getCoupons();
    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: couponData.code?.toUpperCase() || `PROMO-${Date.now()}`,
      title: couponData.title || 'Special Promotion',
      description: couponData.description || '',
      discountType: couponData.discountType || 'percentage',
      discountValue: couponData.discountValue || 10,
      minimumOrderAmount: couponData.minimumOrderAmount || 0,
      maximumDiscountAmount: couponData.maximumDiscountAmount,
      startDate: couponData.startDate || new Date().toISOString(),
      endDate: couponData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimitPerUser: couponData.usageLimitPerUser || 1,
      totalUsageLimit: couponData.totalUsageLimit || 1000,
      timesUsed: 0,
      status: couponData.status || 'active',
      isGlobal: couponData.isGlobal ?? true,
      sellerId: couponData.sellerId,
      sellerName: couponData.sellerName,
      applicableCategoryIds: couponData.applicableCategoryIds,
      createdAt: new Date().toISOString(),
    };

    coupons.unshift(newCoupon);
    mockStorage.saveCoupons(coupons);

    return { success: true, data: newCoupon, message: 'Coupon created successfully' };
  }

  async updateCoupon(id: string, couponData: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    await mockStorage.delay(300);
    const coupons = mockStorage.getCoupons();
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Coupon not found');

    const updated: Coupon = { ...coupons[idx], ...couponData };
    coupons[idx] = updated;
    mockStorage.saveCoupons(coupons);

    return { success: true, data: updated, message: 'Coupon updated successfully' };
  }

  async deleteCoupon(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(200);
    const coupons = mockStorage.getCoupons().filter((c) => c.id !== id);
    mockStorage.saveCoupons(coupons);
    return { success: true, data: { success: true }, message: 'Coupon deleted' };
  }
}

export const mockCouponService = new MockCouponService();
