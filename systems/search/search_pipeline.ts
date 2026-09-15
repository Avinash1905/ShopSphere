import { SearchQueryParser } from './parser.js';
import { SearchNormalizer } from './normalizer.js';
import { InvertedIndex } from './exact_matcher.js';
import { RankingEngine, ScoredSearchResult } from './ranking_engine.js';
import { FilterEngine, SearchFilters } from './filter_engine.js';
import { SortingEngine, SearchSortBy } from './sorting_engine.js';
import { PaginationEngine, SearchPaginationOptions, SearchPaginatedResult } from './pagination_engine.js';
import { SearchSuggestionService } from './search_suggestions.js';
import { SearchHistoryTracker } from './search_history.js';
import { SearchAnalyticsService } from './search_analytics.js';
import { SearchLRUCache } from './search_cache.js';
import { SearchValidator } from './search_validator.js';

export interface SearchRequest {
  query: string;
  userId?: string;
  filters?: SearchFilters;
  sortBy?: SearchSortBy;
  pagination?: SearchPaginationOptions;
  skipCache?: boolean;
}

export class SearchPipeline {
  private index: InvertedIndex;
  private rankingEngine: RankingEngine;
  private suggestionService: SearchSuggestionService;
  private historyTracker: SearchHistoryTracker;
  private analyticsService: SearchAnalyticsService;
  private cache: SearchLRUCache<SearchPaginatedResult<ScoredSearchResult>>;

  constructor(index?: InvertedIndex) {
    this.index = index || new InvertedIndex();
    this.rankingEngine = new RankingEngine(this.index);
    this.suggestionService = new SearchSuggestionService();
    this.historyTracker = new SearchHistoryTracker();
    this.analyticsService = new SearchAnalyticsService();
    this.cache = new SearchLRUCache(500, 180);
  }

  public getIndex(): InvertedIndex {
    return this.index;
  }

  public getSuggestionsService(): SearchSuggestionService {
    return this.suggestionService;
  }

  public getHistoryTracker(): SearchHistoryTracker {
    return this.historyTracker;
  }

  public getAnalyticsService(): SearchAnalyticsService {
    return this.analyticsService;
  }

  public indexProduct(product: {
    id: string;
    title: string;
    description: string;
    sku?: string;
    brandName?: string;
    categoryName?: string;
    tags?: string[];
    attributes?: Record<string, any>;
  }): void {
    const fields: Record<string, string> = {
      title: product.title,
      description: product.description,
      brand: product.brandName || '',
      category: product.categoryName || '',
      sku: product.sku || '',
      tags: (product.tags || []).join(' '),
    };

    this.index.addDocument(product.id, fields, {
      ...product.attributes,
      tags: product.tags,
      brand_name: product.brandName,
      category_name: product.categoryName,
    });

    // Populate suggestion trie
    this.suggestionService.indexTerms([
      product.title,
      product.brandName || '',
      product.categoryName || '',
      ...(product.tags || []),
    ]);

    // Invalidate search cache on catalog modification
    this.cache.clear();
  }

  public execute(request: SearchRequest): SearchPaginatedResult<ScoredSearchResult> {
    const startTime = Date.now();

    // 1. Validation & Sanitization
    const { sanitized } = SearchValidator.validate(request.query);

    // 2. Cache Lookup
    const cacheKey = SearchLRUCache.hashKey({
      q: sanitized,
      f: request.filters,
      s: request.sortBy,
      p: request.pagination,
    });

    if (!request.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 3. Query Parsing
    const parsed = SearchQueryParser.parse(sanitized);

    // Merge parsed field filters with request filters
    const combinedFilters: SearchFilters = {
      ...request.filters,
    };
    if (parsed.fieldFilters.brand) combinedFilters.brandIds = [String(parsed.fieldFilters.brand)];
    if (parsed.fieldFilters.price && typeof parsed.fieldFilters.price === 'object') {
      combinedFilters.minPrice = (parsed.fieldFilters.price as any).min;
      combinedFilters.maxPrice = (parsed.fieldFilters.price as any).max;
    }
    if (parsed.fieldFilters.rating && typeof parsed.fieldFilters.rating === 'object') {
      combinedFilters.minRating = (parsed.fieldFilters.rating as any).min;
    }

    // 4. Ranking (Exact Match + Stemming + Fuzzy + BM25)
    let scoredResults = this.rankingEngine.scoreQuery(parsed.terms, parsed.phrases);

    // 5. Negated Terms Filter
    if (parsed.negatedTerms.length > 0) {
      scoredResults = scoredResults.filter((res) => {
        const fullDocText = Object.values(res.document.fields).join(' ').toLowerCase();
        return !parsed.negatedTerms.some((neg) => fullDocText.includes(neg));
      });
    }

    // 6. Faceted Filters
    const filteredResults = FilterEngine.apply(scoredResults, combinedFilters);

    // 7. Multi-Criteria Sorting
    const sortedResults = SortingEngine.sort(filteredResults, request.sortBy || 'RELEVANCE');

    // 8. Pagination & Facet Aggregations
    const finalResult = PaginationEngine.paginate(sortedResults, request.pagination, startTime);

    // 9. Analytics & History tracking
    this.analyticsService.logQuery({
      query: sanitized,
      userId: request.userId,
      resultCount: finalResult.total,
      executionTimeMs: finalResult.timingMs,
      timestamp: new Date().toISOString(),
    });

    this.historyTracker.recordSearch(request.userId, sanitized, finalResult.total);
    if (sanitized) {
      this.suggestionService.recordPopularQuery(sanitized);
    }

    // 10. Cache Store
    this.cache.set(cacheKey, finalResult);

    return finalResult;
  }
}
