/**
 * ShopSphere Search Engine Subsystem
 * Inverted index, BM25 scoring algorithm, Levenshtein fuzzy distance,
 * n-gram tokenization, and multi-facet aggregation.
 */

import { ProductListing } from '../../packages/shared-types';

export interface SearchFacetItem {
  value: string;
  count: number;
}

export interface SearchFacets {
  categories: SearchFacetItem[];
  brands: SearchFacetItem[];
  priceRanges: { label: string; min: number; max: number; count: number }[];
  ratings: { rating: number; count: number }[];
}

export interface SearchQueryParams {
  query?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'bestseller';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: ProductListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
  processingTimeMs: number;
}

export class SearchEngine {
  private invertedIndex: Map<string, Set<string>> = new Map();
  private docStore: Map<string, ProductListing> = new Map();
  private docLengths: Map<string, number> = new Map();
  private avgDocLength = 0;

  // BM25 parameters
  private readonly k1 = 1.5;
  private readonly b = 0.75;

  public indexProducts(products: ProductListing[]): void {
    this.invertedIndex.clear();
    this.docStore.clear();
    this.docLengths.clear();

    let totalLength = 0;

    for (const product of products) {
      this.docStore.set(product.id, product);
      const tokens = this.tokenize(`${product.title} ${product.description} ${product.categoryName} ${product.brandName || ''} ${product.tags.join(' ')}`);
      
      this.docLengths.set(product.id, tokens.length);
      totalLength += tokens.length;

      for (const token of new Set(tokens)) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token)!.add(product.id);
      }
    }

    this.avgDocLength = products.length > 0 ? totalLength / products.length : 0;
  }

  public search(params: SearchQueryParams): SearchResult {
    const startTime = performance.now();
    const {
      query = '',
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      minRating,
      inStockOnly,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = params;

    let candidateIds: Set<string>;

    if (query.trim()) {
      const queryTokens = this.tokenize(query);
      const scoredDocs = new Map<string, number>();

      for (const token of queryTokens) {
        // Direct match + fuzzy fallback
        const matchingTokens = this.findMatchingTokens(token);
        for (const mToken of matchingTokens) {
          const docIds = this.invertedIndex.get(mToken) || new Set();
          const idf = this.calculateIDF(docIds.size, this.docStore.size);

          for (const docId of docIds) {
            const tf = this.calculateTF(docId, mToken);
            const docLen = this.docLengths.get(docId) || this.avgDocLength;
            const score = idf * ((tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + (this.b * docLen) / this.avgDocLength)));

            scoredDocs.set(docId, (scoredDocs.get(docId) || 0) + score);
          }
        }
      }

      candidateIds = new Set(
        Array.from(scoredDocs.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id)
      );
    } else {
      candidateIds = new Set(this.docStore.keys());
    }

    // Apply Filters
    let matchedProducts = Array.from(candidateIds)
      .map(id => this.docStore.get(id)!)
      .filter(p => {
        if (categoryId && p.categoryId !== categoryId) return false;
        if (brandId && p.brandId !== brandId) return false;
        if (minPrice !== undefined && p.basePrice < minPrice) return false;
        if (maxPrice !== undefined && p.basePrice > maxPrice) return false;
        if (minRating !== undefined && p.rating < minRating) return false;
        if (inStockOnly && p.stockQuantity <= 0) return false;
        return true;
      });

    // Compute Facets before pagination
    const facets = this.computeFacets(matchedProducts);

    // Apply Sorting
    if (sortBy === 'price_asc') {
      matchedProducts.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price_desc') {
      matchedProducts.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'rating') {
      matchedProducts.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'bestseller') {
      matchedProducts.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === 'newest') {
      matchedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = matchedProducts.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const items = matchedProducts.slice(startIndex, startIndex + limit);
    const processingTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      facets,
      processingTimeMs
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  private findMatchingTokens(queryToken: string): string[] {
    const matches: string[] = [];
    if (this.invertedIndex.has(queryToken)) {
      matches.push(queryToken);
    }

    // Prefix & Levenshtein matching
    for (const token of this.invertedIndex.keys()) {
      if (token !== queryToken) {
        if (token.startsWith(queryToken) || queryToken.startsWith(token)) {
          matches.push(token);
        } else if (Math.abs(token.length - queryToken.length) <= 2 && this.levenshtein(token, queryToken) <= 2) {
          matches.push(token);
        }
      }
    }
    return matches;
  }

  private calculateIDF(docCount: number, totalDocs: number): number {
    return Math.log(1 + (totalDocs - docCount + 0.5) / (docCount + 0.5));
  }

  private calculateTF(docId: string, token: string): number {
    const product = this.docStore.get(docId);
    if (!product) return 0;
    const text = `${product.title} ${product.description} ${product.tags.join(' ')}`.toLowerCase();
    const count = (text.match(new RegExp(`\\b${token}\\b`, 'g')) || []).length;
    return count;
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private computeFacets(products: ProductListing[]): SearchFacets {
    const categoryMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    const ratingMap = new Map<number, number>();

    const priceRanges = [
      { label: 'Under $25', min: 0, max: 25, count: 0 },
      { label: '$25 to $50', min: 25, max: 50, count: 0 },
      { label: '$50 to $100', min: 50, max: 100, count: 0 },
      { label: '$100 to $200', min: 100, max: 200, count: 0 },
      { label: '$200 and Above', min: 200, max: 100000, count: 0 }
    ];

    for (const p of products) {
      // Category
      categoryMap.set(p.categoryName, (categoryMap.get(p.categoryName) || 0) + 1);
      // Brand
      if (p.brandName) {
        brandMap.set(p.brandName, (brandMap.get(p.brandName) || 0) + 1);
      }
      // Rating
      const roundedRating = Math.floor(p.rating);
      ratingMap.set(roundedRating, (ratingMap.get(roundedRating) || 0) + 1);
      // Price
      for (const range of priceRanges) {
        if (p.basePrice >= range.min && p.basePrice < range.max) {
          range.count++;
        }
      }
    }

    return {
      categories: Array.from(categoryMap.entries()).map(([value, count]) => ({ value, count })),
      brands: Array.from(brandMap.entries()).map(([value, count]) => ({ value, count })),
      priceRanges,
      ratings: [5, 4, 3, 2, 1].map(rating => ({ rating, count: ratingMap.get(rating) || 0 }))
    };
  }
}
