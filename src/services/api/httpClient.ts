import { ApiResponse, ApiErrorResponse } from '../../types';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class HttpClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  private getAuthToken(): string | null {
    try {
      const session = localStorage.getItem('shopsphere_session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.token || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, headers = {}, ...customConfig } = options;
    const token = this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...customConfig,
    };

    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const errorData: ApiErrorResponse = data;
        throw new Error(errorData.error?.message || `HTTP Error ${response.status}`);
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      throw new Error(err.message || 'Network error occurred');
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params, ...options });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const httpClient = new HttpClient();
