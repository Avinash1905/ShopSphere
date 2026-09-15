import { ScoredSearchResult } from './ranking_engine.js';

export type SearchSortBy =
  | 'RELEVANCE'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'RATING_DESC'
  | 'POPULARITY_DESC'
  | 'NEWEST';

export class SortingEngine {
  public static sort(results: ScoredSearchResult[], sortBy: SearchSortBy = 'RELEVANCE'): ScoredSearchResult[] {
    const list = [...results];

    switch (sortBy) {
      case 'PRICE_ASC':
        return list.sort((a, b) => Number(a.document.attributes.base_price || 0) - Number(b.document.attributes.base_price || 0));
      case 'PRICE_DESC':
        return list.sort((a, b) => Number(b.document.attributes.base_price || 0) - Number(a.document.attributes.base_price || 0));
      case 'RATING_DESC':
        return list.sort((a, b) => Number(b.document.attributes.rating_average || 0) - Number(a.document.attributes.rating_average || 0));
      case 'POPULARITY_DESC':
        return list.sort((a, b) => Number(b.document.attributes.total_sales_count || 0) - Number(a.document.attributes.total_sales_count || 0));
      case 'NEWEST':
        return list.sort((a, b) => {
          const tA = new Date(a.document.attributes.created_at || 0).getTime();
          const tB = new Date(b.document.attributes.created_at || 0).getTime();
          return tB - tA;
        });
      case 'RELEVANCE':
      default:
        return list.sort((a, b) => b.score - a.score);
    }
  }
}
