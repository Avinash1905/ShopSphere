/**
 * ShopSphere Search Engine - Disjunctive Faceted Navigation Engine
 * Features:
 * - Multi-select OR within facet dimensions (e.g. Brand: Nike OR Adidas)
 * - Conjunction AND across facet dimensions (e.g. Category: Shoes AND Brand: Nike)
 * - Accurate dynamic facet count computation without zeroing out selected sibling options
 * - Hierarchical category paths (e.g. Electronics > Audio > Headphones)
 */

export interface FacetValueCount {
  value: string;
  count: number;
  isSelected: boolean;
}

export interface DisjunctiveFacetResult {
  dimension: string;
  values: FacetValueCount[];
}

export interface SearchItemDoc {
  id: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
}

export class DisjunctiveFacetEngine {
  /**
   * Computes disjunctive facet counts for selected filters
   */
  public static computeFacets(
    allItems: SearchItemDoc[],
    selectedFilters: {
      brands?: string[];
      categories?: string[];
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
    } = {}
  ): {
    filteredItems: SearchItemDoc[];
    facets: DisjunctiveFacetResult[];
  } {
    const selBrands = new Set(selectedFilters.brands || []);
    const selCategories = new Set(selectedFilters.categories || []);

    // Filter helper ignoring one specific facet dimension (for disjunctive count calculation)
    const matchesFilters = (
      item: SearchItemDoc,
      ignoreDimension?: 'brand' | 'category' | 'price' | 'stock'
    ): boolean => {
      if (ignoreDimension !== 'brand' && selBrands.size > 0 && !selBrands.has(item.brand)) {
        return false;
      }
      if (ignoreDimension !== 'category' && selCategories.size > 0 && !selCategories.has(item.category)) {
        return false;
      }
      if (ignoreDimension !== 'price') {
        if (selectedFilters.minPrice !== undefined && item.price < selectedFilters.minPrice) return false;
        if (selectedFilters.maxPrice !== undefined && item.price > selectedFilters.maxPrice) return false;
      }
      if (ignoreDimension !== 'stock') {
        if (selectedFilters.inStockOnly && !item.inStock) return false;
      }
      return true;
    };

    // 1. Fully filtered search result set
    const filteredItems = allItems.filter((item) => matchesFilters(item));

    // 2. Disjunctive Brand Facet (ignores selected brand filter)
    const brandCounts = new Map<string, number>();
    for (const item of allItems) {
      if (matchesFilters(item, 'brand')) {
        brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
      }
    }

    // 3. Disjunctive Category Facet (ignores selected category filter)
    const categoryCounts = new Map<string, number>();
    for (const item of allItems) {
      if (matchesFilters(item, 'category')) {
        categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
      }
    }

    const facets: DisjunctiveFacetResult[] = [
      {
        dimension: 'brand',
        values: Array.from(brandCounts.entries()).map(([value, count]) => ({
          value,
          count,
          isSelected: selBrands.has(value),
        })).sort((a, b) => b.count - a.count),
      },
      {
        dimension: 'category',
        values: Array.from(categoryCounts.entries()).map(([value, count]) => ({
          value,
          count,
          isSelected: selCategories.has(value),
        })).sort((a, b) => b.count - a.count),
      },
    ];

    return {
      filteredItems,
      facets,
    };
  }
}
