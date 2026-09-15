export type SortDirection = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface DateRange {
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  isDefault?: boolean;
  type?: 'home' | 'office' | 'work' | 'other';
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}
