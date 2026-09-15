import { httpClient } from './httpClient';
import { Product, ApiResponse } from '../../types';

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  id?: string;
  url: string;
}

export interface ISearchService {
  getSuggestions(query: string): Promise<ApiResponse<SearchSuggestion[]>>;
  getPopularSearches(): Promise<ApiResponse<string[]>>;
  getRecentSearches(): string[];
  addRecentSearch(query: string): void;
  clearRecentSearches(): void;
  fuzzySearch(query: string): Promise<ApiResponse<Product[]>>;
}

export class ApiSearchService implements ISearchService {
  async getSuggestions(query: string): Promise<ApiResponse<SearchSuggestion[]>> {
    return httpClient.get<SearchSuggestion[]>('/search/suggestions', { query });
  }

  async getPopularSearches(): Promise<ApiResponse<string[]>> {
    return httpClient.get<string[]>('/search/popular');
  }

  getRecentSearches(): string[] {
    try {
      const data = localStorage.getItem('shopsphere_recent_searches');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addRecentSearch(query: string): void {
    if (!query || !query.trim()) return;
    const current = this.getRecentSearches().filter((s) => s.toLowerCase() !== query.toLowerCase());
    current.unshift(query.trim());
    localStorage.setItem('shopsphere_recent_searches', JSON.stringify(current.slice(0, 8)));
  }

  clearRecentSearches(): void {
    localStorage.removeItem('shopsphere_recent_searches');
  }

  async fuzzySearch(query: string): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/search', { query });
  }
}

export const apiSearchService = new ApiSearchService();
