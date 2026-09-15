import { ISearchService, SearchSuggestion } from '../api/searchService';
import { mockStorage } from './mockStorage';
import { Product, ApiResponse } from '../../types';

export class MockSearchService implements ISearchService {
  async getSuggestions(query: string): Promise<ApiResponse<SearchSuggestion[]>> {
    await mockStorage.delay(100);
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const q = query.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];

    // Search categories
    const categories = mockStorage.getCategories();
    categories.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        suggestions.push({
          text: c.name,
          type: 'category',
          id: c.id,
          url: `/catalog?category=${c.slug}`,
        });
      }
    });

    // Search brands
    const brands = mockStorage.getBrands();
    brands.forEach((b) => {
      if (b.name.toLowerCase().includes(q)) {
        suggestions.push({
          text: b.name,
          type: 'brand',
          id: b.id,
          url: `/catalog?brands=${b.id}`,
        });
      }
    });

    // Search products
    const products = mockStorage.getProducts();
    products.forEach((p) => {
      if (p.title.toLowerCase().includes(q)) {
        suggestions.push({
          text: p.title,
          type: 'product',
          id: p.id,
          url: `/product/${p.slug}`,
        });
      }
    });

    return {
      success: true,
      data: suggestions.slice(0, 6),
    };
  }

  async getPopularSearches(): Promise<ApiResponse<string[]>> {
    await mockStorage.delay(50);
    return {
      success: true,
      data: [
        'iPhone 15 Pro Max',
        'Noise Cancelling Headphones',
        'Air Jordan 1',
        'MacBook Pro M3',
        'Dyson Airwrap',
        'Gaming Mouse',
        'Solid Wood Dining Table',
      ],
    };
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
    await mockStorage.delay(200);
    const q = query.toLowerCase().trim();
    const products = mockStorage.getProducts();

    const matches = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.brand?.name.toLowerCase().includes(q)
    );

    return {
      success: true,
      data: matches,
    };
  }
}

export const mockSearchService = new MockSearchService();
