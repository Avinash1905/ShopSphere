import { httpClient } from './httpClient';
import {
  CartItem,
  CartSummary,
  SavedForLaterItem,
  ShippingOption,
  ApiResponse,
} from '../../types';

export interface ICartService {
  getCart(): Promise<ApiResponse<{ items: CartItem[]; summary: CartSummary }>>;
  addItem(productId: string, variantId?: string, quantity?: number): Promise<ApiResponse<CartItem>>;
  updateQuantity(itemId: string, quantity: number): Promise<ApiResponse<CartItem>>;
  removeItem(itemId: string): Promise<ApiResponse<{ success: boolean }>>;
  clearCart(): Promise<ApiResponse<{ success: boolean }>>;
  saveForLater(itemId: string): Promise<ApiResponse<SavedForLaterItem>>;
  moveToCart(savedItemId: string): Promise<ApiResponse<CartItem>>;
  getSavedForLater(): Promise<ApiResponse<SavedForLaterItem[]>>;
  removeSavedItem(savedItemId: string): Promise<ApiResponse<{ success: boolean }>>;
  getShippingOptions(): Promise<ApiResponse<ShippingOption[]>>;
}

export class ApiCartService implements ICartService {
  async getCart(): Promise<ApiResponse<{ items: CartItem[]; summary: CartSummary }>> {
    return httpClient.get<{ items: CartItem[]; summary: CartSummary }>('/cart');
  }

  async addItem(productId: string, variantId?: string, quantity = 1): Promise<ApiResponse<CartItem>> {
    return httpClient.post<CartItem>('/cart/items', { productId, variantId, quantity });
  }

  async updateQuantity(itemId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    return httpClient.patch<CartItem>(`/cart/items/${itemId}`, { quantity });
  }

  async removeItem(itemId: string): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.delete<{ success: boolean }>(`/cart/items/${itemId}`);
  }

  async clearCart(): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.post<{ success: boolean }>('/cart/clear');
  }

  async saveForLater(itemId: string): Promise<ApiResponse<SavedForLaterItem>> {
    return httpClient.post<SavedForLaterItem>(`/cart/items/${itemId}/save-for-later`);
  }

  async moveToCart(savedItemId: string): Promise<ApiResponse<CartItem>> {
    return httpClient.post<CartItem>(`/cart/saved/${savedItemId}/move-to-cart`);
  }

  async getSavedForLater(): Promise<ApiResponse<SavedForLaterItem[]>> {
    return httpClient.get<SavedForLaterItem[]>('/cart/saved');
  }

  async removeSavedItem(savedItemId: string): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.delete<{ success: boolean }>(`/cart/saved/${savedItemId}`);
  }

  async getShippingOptions(): Promise<ApiResponse<ShippingOption[]>> {
    return httpClient.get<ShippingOption[]>('/cart/shipping-options');
  }
}

export const apiCartService = new ApiCartService();
