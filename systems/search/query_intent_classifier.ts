export type SearchIntentType =
  | 'DIRECT_NAVIGATIONAL'
  | 'BRAND_SEARCH'
  | 'CATEGORY_DISCOVERY'
  | 'SPECIFIC_PRODUCT'
  | 'PRICE_SENSITIVE'
  | 'FEATURE_COMPARISON'
  | 'INFORMATIONAL';

export interface ExtractedEntities {
  detectedBrands: string[];
  detectedCategory?: string;
  detectedColors: string[];
  detectedSizes: string[];
  minPrice?: number;
  maxPrice?: number;
  hasDiscountIntent: boolean;
  cleanedKeywords: string[];
}

export interface QueryIntentAnalysis {
  originalQuery: string;
  primaryIntent: SearchIntentType;
  confidenceScore: number;
  entities: ExtractedEntities;
  inferredFilters: Record<string, any>;
  rewrittenSearchQuery: string;
}

export class QueryIntentClassifier {
  private static readonly KNOWN_BRANDS = new Set([
    'apple', 'sony', 'nike', 'samsung', 'kitchenaid', 'adidas', 'dell', 'lenovo', 'lg', 'bose', 'asus'
  ]);

  private static readonly KNOWN_CATEGORIES: Record<string, string[]> = {
    'electronics': ['laptop', 'laptops', 'macbook', 'phone', 'phones', 'smartphone', 'headphone', 'headphones', 'tv', 'tablet'],
    'apparel': ['shoes', 'shoe', 'sneakers', 'shirt', 'jacket', 'pants', 'dress', 'hoodie'],
    'home-kitchen': ['blender', 'mixer', 'cookware', 'coffee', 'toaster', 'microwave'],
  };

  private static readonly KNOWN_COMPOUND_COLORS = [
    'space black', 'space gray', 'space grey', 'rose gold', 'midnight blue', 'desert titanium', 'natural titanium'
  ];

  private static readonly KNOWN_COLORS = new Set([
    'black', 'white', 'silver', 'grey', 'gray', 'red', 'blue', 'green', 'gold', 'titanium'
  ]);

  private static readonly KNOWN_SIZES = new Set([
    'xs', 's', 'm', 'l', 'xl', 'xxl', '16-inch', '14-inch', '15-inch', '256gb', '512gb', '1tb'
  ]);

  /**
   * Classifies user search query intent and extracts structured entity tokens
   */
  public static analyze(query: string): QueryIntentAnalysis {
    if (!query || query.trim().length === 0) {
      return {
        originalQuery: '',
        primaryIntent: 'INFORMATIONAL',
        confidenceScore: 0.0,
        entities: {
          detectedBrands: [],
          detectedColors: [],
          detectedSizes: [],
          hasDiscountIntent: false,
          cleanedKeywords: [],
        },
        inferredFilters: {},
        rewrittenSearchQuery: '',
      };
    }

    let lower = query.toLowerCase().trim();

    const detectedBrands: string[] = [];
    const detectedColors: string[] = [];
    const detectedSizes: string[] = [];
    let detectedCategory: string | undefined;
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    let hasDiscountIntent = false;

    // Check discount keywords
    if (/sale|discount|deal|cheap|clearance|promo/i.test(lower)) {
      hasDiscountIntent = true;
    }

    // Price extraction: "under $500", "below 100", "between 50 and 200", "< 300"
    const underPriceMatch = /(?:under|below|<)\s*\$?(\d+(?:\.\d+)?)/i.exec(lower);
    if (underPriceMatch) {
      maxPrice = parseFloat(underPriceMatch[1]);
    }

    const betweenPriceMatch = /(?:between|\$)\s*(\d+)\s*(?:and|-|to)\s*\$?(\d+)/i.exec(lower);
    if (betweenPriceMatch) {
      minPrice = parseFloat(betweenPriceMatch[1]);
      maxPrice = parseFloat(betweenPriceMatch[2]);
    }

    // Extract compound colors first
    for (const compound of QueryIntentClassifier.KNOWN_COMPOUND_COLORS) {
      if (lower.includes(compound)) {
        detectedColors.push(compound);
        lower = lower.replace(compound, ' ');
      }
    }

    const tokens = lower.split(/\s+/).filter(Boolean);

    // Extract brands, colors, sizes, categories
    const remainingKeywords: string[] = [];

    for (const t of tokens) {
      const cleanToken = t.replace(/[$,]/g, '');
      if (QueryIntentClassifier.KNOWN_BRANDS.has(cleanToken)) {
        detectedBrands.push(cleanToken);
      } else if (QueryIntentClassifier.KNOWN_COLORS.has(cleanToken)) {
        detectedColors.push(cleanToken);
      } else if (QueryIntentClassifier.KNOWN_SIZES.has(cleanToken)) {
        detectedSizes.push(cleanToken);
      } else if (!/^(under|below|between|and|to|for|with|in|<|>)$/i.test(cleanToken) && isNaN(Number(cleanToken))) {
        remainingKeywords.push(cleanToken);
      }

      // Check category match
      for (const [catName, catKeywords] of Object.entries(QueryIntentClassifier.KNOWN_CATEGORIES)) {
        if (catKeywords.includes(cleanToken)) {
          detectedCategory = catName;
        }
      }
    }

    // Determine primary intent
    let primaryIntent: SearchIntentType = 'INFORMATIONAL';
    let confidence = 0.5;

    if (maxPrice !== undefined || minPrice !== undefined || hasDiscountIntent) {
      primaryIntent = 'PRICE_SENSITIVE';
      confidence = 0.9;
    } else if (detectedBrands.length > 0 && remainingKeywords.length === 0) {
      primaryIntent = 'BRAND_SEARCH';
      confidence = 0.95;
    } else if (detectedCategory && remainingKeywords.length <= 1) {
      primaryIntent = 'CATEGORY_DISCOVERY';
      confidence = 0.85;
    } else if (detectedBrands.length > 0 && remainingKeywords.length > 0) {
      primaryIntent = 'SPECIFIC_PRODUCT';
      confidence = 0.9;
    } else if (/vs|compare|or|difference/i.test(lower)) {
      primaryIntent = 'FEATURE_COMPARISON';
      confidence = 0.8;
    } else {
      primaryIntent = 'CATEGORY_DISCOVERY';
      confidence = 0.6;
    }

    const inferredFilters: Record<string, any> = {};
    if (detectedBrands.length > 0) inferredFilters.brands = detectedBrands;
    if (detectedCategory) inferredFilters.category = detectedCategory;
    if (minPrice !== undefined) inferredFilters.minPrice = minPrice;
    if (maxPrice !== undefined) inferredFilters.maxPrice = maxPrice;
    if (hasDiscountIntent) inferredFilters.onSaleOnly = true;

    const rewrittenQuery = remainingKeywords.length > 0 ? remainingKeywords.join(' ') : query;

    return {
      originalQuery: query,
      primaryIntent,
      confidenceScore: confidence,
      entities: {
        detectedBrands,
        detectedCategory,
        detectedColors,
        detectedSizes,
        minPrice,
        maxPrice,
        hasDiscountIntent,
        cleanedKeywords: remainingKeywords,
      },
      inferredFilters,
      rewrittenSearchQuery: rewrittenQuery,
    };
  }
}
