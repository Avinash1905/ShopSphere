import { httpClient } from './httpClient';
import { Coupon, CouponValidationResult, ApiResponse } from '../../types';

export interface ICouponService {
  validateCoupon(code: string, cartTotal: number, categoryIds?: string[]): Promise<ApiResponse<CouponValidationResult>>;
  getAvailableCoupons(): Promise<ApiResponse<Coupon[]>>;
  createCoupon(coupon: Partial<Coupon>): Promise<ApiResponse<Coupon>>;
  updateCoupon(id: string, coupon: Partial<Coupon>): Promise<ApiResponse<Coupon>>;
  deleteCoupon(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export class ApiCouponService implements ICouponService {
  async validateCoupon(code: string, cartTotal: number, categoryIds?: string[]): Promise<ApiResponse<CouponValidationResult>> {
    return httpClient.post<CouponValidationResult>('/coupons/validate', { code, cartTotal, categoryIds });
  }

  async getAvailableCoupons(): Promise<ApiResponse<Coupon[]>> {
    return httpClient.get<Coupon[]>('/coupons/active');
  }

  async createCoupon(coupon: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    return httpClient.post<Coupon>('/coupons', coupon);
  }

  async updateCoupon(id: string, coupon: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    return httpClient.put<Coupon>(`/coupons/${id}`, coupon);
  }

  async deleteCoupon(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.delete<{ success: boolean }>(`/coupons/${id}`);
  }
}

export const apiCouponService = new ApiCouponService();
