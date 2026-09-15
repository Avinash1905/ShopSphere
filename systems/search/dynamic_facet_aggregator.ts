export interface AggregatedFacetValueCount {
  value: string;
  count: number;
  selected: boolean;
}

export interface NumericHistogramBucket {
  from: number;
  to: number;
  label: string;
  count: number;
}

export interface DimensionFacetResult {
  dimension: string;
  displayName: string;
  type: 'STRING' | 'NUMERIC_HISTOGRAM' | 'BOOLEAN';
  buckets: AggregatedFacetValueCount[];
  histogram?: NumericHistogramBucket[];
}

export interface SearchFacetOverview {
  totalMatchingDocuments: number;
  facets: DimensionFacetResult[];
}

export class DynamicFacetAggregator {
  /**
   * Aggregates multi-dimensional facets across matching search results
   */
  public static aggregate(
    documents: Array<Record<string, any>>,
    activeFilters: Record<string, string[] | number | boolean> = {}
  ): SearchFacetOverview {
    const brandCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const ratingCounts = new Map<string, number>();
    const inStockCounts = { inStock: 0, outOfStock: 0 };

    const priceIntervals: NumericHistogramBucket[] = [
      { from: 0, to: 50, label: '$0 - $50', count: 0 },
      { from: 50, to: 100, label: '$50 - $100', count: 0 },
      { from: 100, to: 500, label: '$100 - $500', count: 0 },
      { from: 500, to: 1000, label: '$500 - $1,000', count: 0 },
      { from: 1000, to: 10000, label: '$1,000+', count: 0 },
    ];

    for (const doc of documents) {
      // 1. Brands
      if (doc.brand) {
        const b = String(doc.brand);
        brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
      }

      // 2. Categories
      if (doc.category) {
        const c = String(doc.category);
        categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1);
      }

      // 3. Ratings (rounded to integer stars)
      if (doc.rating !== undefined) {
        const stars = `${Math.floor(Number(doc.rating))} Stars & Up`;
        ratingCounts.set(stars, (ratingCounts.get(stars) || 0) + 1);
      }

      // 4. In Stock
      if (doc.inStock === true || Number(doc.stock || 0) > 0) {
        inStockCounts.inStock++;
      } else {
        inStockCounts.outOfStock++;
      }

      // 5. Price Histogram
      if (doc.price !== undefined) {
        const price = Number(doc.price);
        for (const bucket of priceIntervals) {
          if (price >= bucket.from && price < bucket.to) {
            bucket.count++;
            break;
          }
        }
      }
    }

    const selectedBrands = new Set(
      Array.isArray(activeFilters.brands) ? activeFilters.brands.map(String) : []
    );
    const selectedCategories = new Set(
      Array.isArray(activeFilters.categories) ? activeFilters.categories.map(String) : []
    );

    const brandBuckets: AggregatedFacetValueCount[] = Array.from(brandCounts.entries())
      .map(([value, count]) => ({
        value,
        count,
        selected: selectedBrands.has(value),
      }))
      .sort((a, b) => b.count - a.count);

    const categoryBuckets: AggregatedFacetValueCount[] = Array.from(categoryCounts.entries())
      .map(([value, count]) => ({
        value,
        count,
        selected: selectedCategories.has(value),
      }))
      .sort((a, b) => b.count - a.count);

    const ratingBuckets: AggregatedFacetValueCount[] = Array.from(ratingCounts.entries())
      .map(([value, count]) => ({
        value,
        count,
        selected: false,
      }))
      .sort((a, b) => b.value.localeCompare(a.value));

    const facets: DimensionFacetResult[] = [
      {
        dimension: 'brands',
        displayName: 'Brand',
        type: 'STRING',
        buckets: brandBuckets,
      },
      {
        dimension: 'categories',
        displayName: 'Category',
        type: 'STRING',
        buckets: categoryBuckets,
      },
      {
        dimension: 'price',
        displayName: 'Price Range',
        type: 'NUMERIC_HISTOGRAM',
        buckets: [],
        histogram: priceIntervals.filter((b) => b.count > 0),
      },
      {
        dimension: 'ratings',
        displayName: 'Customer Reviews',
        type: 'STRING',
        buckets: ratingBuckets,
      },
      {
        dimension: 'availability',
        displayName: 'Availability',
        type: 'BOOLEAN',
        buckets: [
          { value: 'In Stock', count: inStockCounts.inStock, selected: activeFilters.inStockOnly === true },
          { value: 'Out of Stock', count: inStockCounts.outOfStock, selected: false },
        ],
      },
    ];

    return {
      totalMatchingDocuments: documents.length,
      facets,
    };
  }
}
