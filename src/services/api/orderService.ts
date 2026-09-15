import { httpClient } from './httpClient';
import {
  Order,
  ReturnRequest,
  Invoice,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export interface CreateOrderParams {
  shippingAddressId: string;
  billingAddressId: string;
  shippingOptionId: string;
  paymentDetails: any;
  couponCode?: string;
  notes?: string;
}

export interface IOrderService {
  createOrder(params: CreateOrderParams): Promise<ApiResponse<Order>>;
  getUserOrders(page?: number, limit?: number, status?: string): Promise<PaginatedResponse<Order>>;
  getOrderById(id: string): Promise<ApiResponse<Order>>;
  getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>>;
  cancelOrder(orderId: string, reason: string): Promise<ApiResponse<Order>>;
  requestReturn(data: Partial<ReturnRequest>): Promise<ApiResponse<ReturnRequest>>;
  getInvoice(orderId: string): Promise<ApiResponse<Invoice>>;
}

export class ApiOrderService implements IOrderService {
  async createOrder(params: CreateOrderParams): Promise<ApiResponse<Order>> {
    return httpClient.post<Order>('/orders', params);
  }

  async getUserOrders(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Order>> {
    const res = await httpClient.get<any>('/orders', { page, limit, status });
    return res as unknown as PaginatedResponse<Order>;
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return httpClient.get<Order>(`/orders/${id}`);
  }

  async getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    return httpClient.get<Order>(`/orders/number/${orderNumber}`);
  }

  async cancelOrder(orderId: string, reason: string): Promise<ApiResponse<Order>> {
    return httpClient.post<Order>(`/orders/${orderId}/cancel`, { reason });
  }

  async requestReturn(data: Partial<ReturnRequest>): Promise<ApiResponse<ReturnRequest>> {
    return httpClient.post<ReturnRequest>('/orders/returns', data);
  }

  async getInvoice(orderId: string): Promise<ApiResponse<Invoice>> {
    return httpClient.get<Invoice>(`/orders/${orderId}/invoice`);
  }
}

export const apiOrderService = new ApiOrderService();
