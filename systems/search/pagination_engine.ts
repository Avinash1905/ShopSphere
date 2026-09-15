import { ScoredSearchResult } from './ranking_engine.js';

export interface SearchPaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SearchPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  facets: SearchFacets;
  timingMs: number;
}

export interface SearchFacets {
  categories: { id: string; name: string; count: number }[];
  brands: { id: string; name: string; count: number }[];
  priceRange: { min: number; max: number; avg: number };
  ratingCounts: Record<number, number>;
}

export class PaginationEngine {
  public static paginate(
    results: ScoredSearchResult[],
    options: SearchPaginationOptions = {},
    startTimeMs: number = Date.now()
  ): SearchPaginatedResult<ScoredSearchResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const items = results.slice(offset, offset + limit);

    // Compute aggregation facets across entire matched result set
    const facets = this.computeFacets(results);
    const timingMs = Date.now() - startTimeMs;

    let nextCursor: string | undefined;
    if (page < totalPages && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(`cursor:${page + 1}:${lastItem.docId}`).toString('base64');
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextCursor,
      facets,
      timingMs,
    };
  }

  private static computeFacets(results: ScoredSearchResult[]): SearchFacets {
    const catCounts: Map<string, { id: string; name: string; count: number }> = new Map();
    const brandCounts: Map<string, { id: string; name: string; count: number }> = new Map();
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalPrice = 0;

    for (const r of results) {
      const attrs = r.document.attributes;

      // Category facet
      if (attrs.category_id && attrs.category_name) {
        let cat = catCounts.get(attrs.category_id);
        if (!cat) {
          cat = { id: attrs.category_id, name: attrs.category_name, count: 0 };
          catCounts.set(attrs.category_id, cat);
        }
        cat.count++;
      }

      // Brand facet
      if (attrs.brand_id && attrs.brand_name) {
        let b = brandCounts.get(attrs.brand_id);
        if (!b) {
          b = { id: attrs.brand_id, name: attrs.brand_name, count: 0 };
          brandCounts.set(attrs.brand_id, b);
        }
        b.count++;
      }

      // Price stats
      const price = Number(attrs.base_price || 0);
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
      totalPrice += price;

      // Rating counts
      const rating = Math.min(5, Math.max(1, Math.round(Number(attrs.rating_average || 0))));
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    }

    const count = results.length;
    return {
      categories: Array.from(catCounts.values()).sort((a, b) => b.count - a.count),
      brands: Array.from(brandCounts.values()).sort((a, b) => b.count - a.count),
      priceRange: {
        min: count > 0 && minPrice !== Infinity ? minPrice : 0,
        max: count > 0 && maxPrice !== -Infinity ? maxPrice : 0,
        avg: count > 0 ? Math.round((totalPrice / count) * 100) / 100 : 0,
      },
      ratingCounts,
    };
  }
}
