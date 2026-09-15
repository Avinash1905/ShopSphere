import { httpClient } from './httpClient';
import {
  PlatformStats,
  AuditLog,
  PlatformSettings,
  User,
  SellerProfile,
  Product,
  ProductReview,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export interface IAdminService {
  getPlatformStats(): Promise<ApiResponse<PlatformStats>>;
  getUsers(page?: number, limit?: number, role?: string, status?: string): Promise<PaginatedResponse<User>>;
  updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason: string): Promise<ApiResponse<User>>;
  getSellers(page?: number, limit?: number, status?: string): Promise<PaginatedResponse<SellerProfile>>;
  moderateSeller(sellerId: string, action: 'approve' | 'reject' | 'suspend', commissionRate?: number, notes?: string): Promise<ApiResponse<SellerProfile>>;
  getPendingProducts(page?: number, limit?: number): Promise<PaginatedResponse<Product>>;
  moderateProduct(productId: string, action: 'approve' | 'reject', feedback?: string): Promise<ApiResponse<Product>>;
  getFlaggedReviews(page?: number, limit?: number): Promise<PaginatedResponse<ProductReview>>;
  moderateReview(reviewId: string, action: 'publish' | 'hide' | 'delete'): Promise<ApiResponse<{ success: boolean }>>;
  getAuditLogs(page?: number, limit?: number): Promise<PaginatedResponse<AuditLog>>;
  getPlatformSettings(): Promise<ApiResponse<PlatformSettings>>;
  updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>>;
}

export class ApiAdminService implements IAdminService {
  async getPlatformStats(): Promise<ApiResponse<PlatformStats>> {
    return httpClient.get<PlatformStats>('/admin/stats');
  }

  async getUsers(page = 1, limit = 10, role?: string, status?: string): Promise<PaginatedResponse<User>> {
    const res = await httpClient.get<any>('/admin/users', { page, limit, role, status });
    return res as unknown as PaginatedResponse<User>;
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason: string): Promise<ApiResponse<User>> {
    return httpClient.patch<User>(`/admin/users/${userId}/status`, { status, reason });
  }

  async getSellers(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<SellerProfile>> {
    const res = await httpClient.get<any>('/admin/sellers', { page, limit, status });
    return res as unknown as PaginatedResponse<SellerProfile>;
  }

  async moderateSeller(sellerId: string, action: 'approve' | 'reject' | 'suspend', commissionRate?: number, notes?: string): Promise<ApiResponse<SellerProfile>> {
    return httpClient.post<SellerProfile>(`/admin/sellers/${sellerId}/moderate`, { action, commissionRate, notes });
  }

  async getPendingProducts(page = 1, limit = 10): Promise<PaginatedResponse<Product>> {
    const res = await httpClient.get<any>('/admin/products/pending', { page, limit });
    return res as unknown as PaginatedResponse<Product>;
  }

  async moderateProduct(productId: string, action: 'approve' | 'reject', feedback?: string): Promise<ApiResponse<Product>> {
    return httpClient.post<Product>(`/admin/products/${productId}/moderate`, { action, feedback });
  }

  async getFlaggedReviews(page = 1, limit = 10): Promise<PaginatedResponse<ProductReview>> {
    const res = await httpClient.get<any>('/admin/reviews/flagged', { page, limit });
    return res as unknown as PaginatedResponse<ProductReview>;
  }

  async moderateReview(reviewId: string, action: 'publish' | 'hide' | 'delete'): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.post<{ success: boolean }>(`/admin/reviews/${reviewId}/moderate`, { action });
  }

  async getAuditLogs(page = 1, limit = 15): Promise<PaginatedResponse<AuditLog>> {
    const res = await httpClient.get<any>('/admin/audit-logs', { page, limit });
    return res as unknown as PaginatedResponse<AuditLog>;
  }

  async getPlatformSettings(): Promise<ApiResponse<PlatformSettings>> {
    return httpClient.get<PlatformSettings>('/admin/settings');
  }

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>> {
    return httpClient.patch<PlatformSettings>('/admin/settings', settings);
  }
}

export const apiAdminService = new ApiAdminService();
