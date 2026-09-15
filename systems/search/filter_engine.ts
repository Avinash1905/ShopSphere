import { ScoredSearchResult } from './ranking_engine.js';

export interface SearchFilters {
  categoryId?: string;
  categoryHierarchyPath?: string;
  brandIds?: string[];
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  tags?: string[];
  status?: string;
  attributes?: Record<string, any>;
}

export class FilterEngine {
  public static apply(results: ScoredSearchResult[], filters: SearchFilters = {}): ScoredSearchResult[] {
    return results.filter((res) => {
      const attrs = res.document.attributes;

      // 1. Category filter
      if (filters.categoryId && attrs.category_id !== filters.categoryId) {
        return false;
      }
      if (filters.categoryHierarchyPath) {
        const docPath = attrs.hierarchy_path || '';
        if (docPath !== filters.categoryHierarchyPath && !docPath.startsWith(`${filters.categoryHierarchyPath}/`)) {
          return false;
        }
      }

      // 2. Brand filter
      if (filters.brandIds && filters.brandIds.length > 0) {
        if (!filters.brandIds.includes(attrs.brand_id)) {
          return false;
        }
      }

      // 3. Seller filter
      if (filters.sellerId && attrs.seller_id !== filters.sellerId) {
        return false;
      }

      // 4. Price range
      const price = Number(attrs.base_price || 0);
      if (filters.minPrice !== undefined && price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && price > filters.maxPrice) {
        return false;
      }

      // 5. Minimum Rating
      const rating = Number(attrs.rating_average || 0);
      if (filters.minRating !== undefined && rating < filters.minRating) {
        return false;
      }

      // 6. Availability / In Stock
      if (filters.inStockOnly && attrs.in_stock === false) {
        return false;
      }

      // 7. Status filter
      if (filters.status && attrs.status !== filters.status) {
        return false;
      }

      // 8. Tags filter (intersection)
      if (filters.tags && filters.tags.length > 0) {
        const docTags: string[] = Array.isArray(attrs.tags) ? attrs.tags : [];
        const hasAnyTag = filters.tags.some((t) => docTags.includes(t.toLowerCase()));
        if (!hasAnyTag) return false;
      }

      // 9. Custom attribute filters
      if (filters.attributes) {
        const docAttrs = attrs.attributes || {};
        for (const [key, val] of Object.entries(filters.attributes)) {
          if (docAttrs[key] !== val) return false;
        }
      }

      return true;
    });
  }
}
