import { httpClient } from './httpClient';
import {
  SellerProfile,
  SellerDashboardStats,
  SellerPayout,
  SellerInventoryAlert,
  Order,
  Product,
  ReturnRequest,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export interface ISellerService {
  getSellerProfile(sellerId?: string): Promise<ApiResponse<SellerProfile>>;
  updateSellerProfile(data: Partial<SellerProfile>): Promise<ApiResponse<SellerProfile>>;
  getDashboardStats(): Promise<ApiResponse<SellerDashboardStats>>;
  getSellerProducts(page?: number, limit?: number, status?: string): Promise<PaginatedResponse<Product>>;
  getInventoryAlerts(): Promise<ApiResponse<SellerInventoryAlert[]>>;
  updateStock(productId: string, variantId?: string, quantity?: number, reorderThreshold?: number): Promise<ApiResponse<{ success: boolean }>>;
  getSellerOrders(page?: number, limit?: number, status?: string): Promise<PaginatedResponse<Order>>;
  fulfillOrder(orderId: string, carrier: string, trackingNumber: string): Promise<ApiResponse<Order>>;
  getReturnRequests(): Promise<ApiResponse<ReturnRequest[]>>;
  resolveReturnRequest(returnId: string, action: 'approve' | 'reject' | 'refund', notes?: string): Promise<ApiResponse<ReturnRequest>>;
  getPayouts(): Promise<ApiResponse<SellerPayout[]>>;
  requestPayout(amount: number): Promise<ApiResponse<SellerPayout>>;
}

export class ApiSellerService implements ISellerService {
  async getSellerProfile(sellerId?: string): Promise<ApiResponse<SellerProfile>> {
    return httpClient.get<SellerProfile>('/seller/profile', { sellerId });
  }

  async updateSellerProfile(data: Partial<SellerProfile>): Promise<ApiResponse<SellerProfile>> {
    return httpClient.patch<SellerProfile>('/seller/profile', data);
  }

  async getDashboardStats(): Promise<ApiResponse<SellerDashboardStats>> {
    return httpClient.get<SellerDashboardStats>('/seller/dashboard/stats');
  }

  async getSellerProducts(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Product>> {
    const res = await httpClient.get<any>('/seller/products', { page, limit, status });
    return res as unknown as PaginatedResponse<Product>;
  }

  async getInventoryAlerts(): Promise<ApiResponse<SellerInventoryAlert[]>> {
    return httpClient.get<SellerInventoryAlert[]>('/seller/inventory/alerts');
  }

  async updateStock(productId: string, variantId?: string, quantity = 0, reorderThreshold = 5): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.patch<{ success: boolean }>('/seller/inventory/stock', { productId, variantId, quantity, reorderThreshold });
  }

  async getSellerOrders(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Order>> {
    const res = await httpClient.get<any>('/seller/orders', { page, limit, status });
    return res as unknown as PaginatedResponse<Order>;
  }

  async fulfillOrder(orderId: string, carrier: string, trackingNumber: string): Promise<ApiResponse<Order>> {
    return httpClient.post<Order>(`/seller/orders/${orderId}/fulfill`, { carrier, trackingNumber });
  }

  async getReturnRequests(): Promise<ApiResponse<ReturnRequest[]>> {
    return httpClient.get<ReturnRequest[]>('/seller/returns');
  }

  async resolveReturnRequest(returnId: string, action: 'approve' | 'reject' | 'refund', notes?: string): Promise<ApiResponse<ReturnRequest>> {
    return httpClient.post<ReturnRequest>(`/seller/returns/${returnId}/resolve`, { action, notes });
  }

  async getPayouts(): Promise<ApiResponse<SellerPayout[]>> {
    return httpClient.get<SellerPayout[]>('/seller/payouts');
  }

  async requestPayout(amount: number): Promise<ApiResponse<SellerPayout>> {
    return httpClient.post<SellerPayout>('/seller/payouts/request', { amount });
  }
}

export const apiSellerService = new ApiSellerService();
