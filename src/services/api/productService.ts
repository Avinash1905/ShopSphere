import { httpClient } from './httpClient';
import {
  Product,
  ProductFilterParams,
  PaginatedResponse,
  Category,
  Brand,
  ApiResponse,
} from '../../types';

export interface IProductService {
  getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<Product>>;
  getProductBySlug(slug: string): Promise<ApiResponse<Product>>;
  getProductById(id: string): Promise<ApiResponse<Product>>;
  getCategories(): Promise<ApiResponse<Category[]>>;
  getBrands(): Promise<ApiResponse<Brand[]>>;
  getFeaturedProducts(limit?: number): Promise<ApiResponse<Product[]>>;
  getTrendingProducts(limit?: number): Promise<ApiResponse<Product[]>>;
  getDealsOfTheDay(limit?: number): Promise<ApiResponse<Product[]>>;
  getRelatedProducts(productId: string, limit?: number): Promise<ApiResponse<Product[]>>;
  createProduct(data: Partial<Product>): Promise<ApiResponse<Product>>;
  updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>>;
  deleteProduct(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export class ApiProductService implements IProductService {
  async getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<Product>> {
    const res = await httpClient.get<any>('/products', params);
    return res as unknown as PaginatedResponse<Product>;
  }

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    return httpClient.get<Product>(`/products/slug/${slug}`);
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return httpClient.get<Product>(`/products/${id}`);
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return httpClient.get<Category[]>('/categories');
  }

  async getBrands(): Promise<ApiResponse<Brand[]>> {
    return httpClient.get<Brand[]>('/brands');
  }

  async getFeaturedProducts(limit = 8): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/products/featured', { limit });
  }

  async getTrendingProducts(limit = 8): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/products/trending', { limit });
  }

  async getDealsOfTheDay(limit = 4): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/products/deals', { limit });
  }

  async getRelatedProducts(productId: string, limit = 4): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>(`/products/${productId}/related`, { limit });
  }

  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return httpClient.post<Product>('/products', data);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    return httpClient.put<Product>(`/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.delete<{ success: boolean }>(`/products/${id}`);
  }
}

export const apiProductService = new ApiProductService();
