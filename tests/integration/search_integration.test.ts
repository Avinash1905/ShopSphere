import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SearchPipeline } from '../../systems/search/search_pipeline.js';
import { SearchTokenizer } from '../../systems/search/tokenizer.js';
import { FuzzyMatcher } from '../../systems/search/fuzzy_matcher.js';

describe('Search Engine Integration Test Suite', () => {
  it('should tokenize, stem, and generate phonetic representations', () => {
    const tokens = SearchTokenizer.tokenize('Running high-performance laptops with noise-canceling headphones');
    Assert.greaterThan(tokens.length, 4, 'Tokenized words count');

    const runToken = tokens.find((t) => t.term === 'running');
    Assert.isNotNull(runToken, 'Found running token');
    Assert.equal(runToken!.stemmed, 'run', 'Porter stemmer reduced running to run');

    const soundexCode = SearchTokenizer.soundex('MacBook');
    Assert.equal(soundexCode.length, 4, 'Soundex length is 4 characters');
  });

  it('should compute fuzzy string distances and prefix trie lookups', () => {
    // Levenshtein distance
    const dist1 = FuzzyMatcher.levenshtein('macbook', 'macbok');
    Assert.equal(dist1, 1, 'Levenshtein typo distance is 1');

    const sim = FuzzyMatcher.trigramSimilarity('headphones', 'headphone');
    Assert.greaterThan(sim, 0.8, 'Trigram similarity > 0.8 for close match');

    const jaro = FuzzyMatcher.jaroWinkler('Apple', 'Appel');
    Assert.greaterThan(jaro, 0.85, 'Jaro-Winkler similarity > 0.85');
  });

  it('should execute end-to-end Search Pipeline with BM25 ranking, facets, and suggestions', () => {
    const pipeline = new SearchPipeline();

    // Index sample products
    pipeline.indexProduct({
      id: 'prod-macbook-16',
      title: 'Apple MacBook Pro 16" M3 Max',
      description: 'Supercharged laptop by Apple with Liquid Retina display and 48GB unified memory.',
      sku: 'AAPL-MBP16-M3',
      brandName: 'Apple',
      categoryName: 'Laptops',
      tags: ['apple', 'laptop', 'm3', 'macos'],
      attributes: { base_price: 3499.0, rating_average: 4.9, total_sales_count: 1500, in_stock: true, brand_id: 'brand-apple', category_id: 'cat-laptops' },
    });

    pipeline.indexProduct({
      id: 'prod-sony-wh1000',
      title: 'Sony WH-1000XM5 Noise Canceling Headphones',
      description: 'Industry-leading active noise cancellation with 30-hour battery life.',
      sku: 'SNY-WH1000-BLK',
      brandName: 'Sony',
      categoryName: 'Audio',
      tags: ['sony', 'audio', 'anc', 'wireless'],
      attributes: { base_price: 399.99, rating_average: 4.8, total_sales_count: 2800, in_stock: true, brand_id: 'brand-sony', category_id: 'cat-audio' },
    });

    pipeline.indexProduct({
      id: 'prod-iphone-16',
      title: 'Apple iPhone 16 Pro Max',
      description: 'Titanium smartphone with Apple intelligence, A18 Pro chip and 48MP camera.',
      sku: 'AAPL-IP16-PRO',
      brandName: 'Apple',
      categoryName: 'Smartphones',
      tags: ['apple', 'phone', 'ios', 'titanium'],
      attributes: { base_price: 1199.0, rating_average: 4.85, total_sales_count: 4200, in_stock: true, brand_id: 'brand-apple', category_id: 'cat-smartphones' },
    });

    // 1. Search for "Apple Laptop"
    const searchRes = pipeline.execute({ query: 'Apple Laptop' });
    Assert.greaterThan(searchRes.total, 0, 'Search returned results');
    Assert.equal(searchRes.items[0].docId, 'prod-macbook-16', 'MacBook Pro ranked #1 for Apple Laptop');

    // 2. Fuzzy Search with Typo "noize cancleing"
    const fuzzyRes = pipeline.execute({ query: 'noize cancleing' });
    Assert.greaterThan(fuzzyRes.total, 0, 'Fuzzy search matched Sony headphones despite typos');
    Assert.equal(fuzzyRes.items[0].docId, 'prod-sony-wh1000', 'Sony headphones found on typo query');

    // 3. Facets calculation
    const allSearch = pipeline.execute({ query: 'Apple' });
    Assert.equal(allSearch.facets.brands[0].name, 'Apple', 'Brand facet calculated');
    Assert.equal(allSearch.facets.brands[0].count, 2, 'Two Apple products in facet');

    // 4. Suggestions
    const suggestions = pipeline.getSuggestionsService().getSuggestions('macb');
    Assert.greaterThan(suggestions.length, 0, 'Found autocomplete suggestion for macb');
    Assert.isTrue(suggestions[0].text.includes('macbook'), 'Suggested MacBook');
  });
});
