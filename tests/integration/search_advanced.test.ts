/**
 * Test Suite: Advanced Search Subsystem Integration Test
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SynonymExpansionEngine } from '../../systems/search/synonym_expansion_engine.js';
import { SpellCorrector } from '../../systems/search/spell_corrector.js';
import { BooleanProximityParser } from '../../systems/search/boolean_proximity_parser.js';
import { VectorSemanticSearch } from '../../systems/search/vector_semantic_search.js';
import { DisjunctiveFacetEngine, SearchItemDoc } from '../../systems/search/disjunctive_facet_engine.js';
import { ClickthroughReranker, ProductInteractionMetrics, UserAffinityProfile } from '../../systems/search/clickthrough_reranker.js';

describe('Advanced Search Subsystem Test Suite', () => {
  it('should expand query tokens with synonym graph terms and weights', () => {
    const tokens = ['mobile', 'headphones'];
    const expanded = SynonymExpansionEngine.expandTokens(tokens);

    Assert.isTrue(expanded.some((t) => t.token === 'mobile' && t.isOriginal));
    Assert.isTrue(expanded.some((t) => t.token === 'phone' && !t.isOriginal));
    Assert.isTrue(expanded.some((t) => t.token === 'smartphone' && !t.isOriginal));
    Assert.isTrue(expanded.some((t) => t.token === 'earbuds' && !t.isOriginal));
  });

  it('should correct misspelled queries and generate "Did You Mean" suggestions', () => {
    const corrections = SpellCorrector.correctWord('hedphones', 2);
    Assert.greaterThan(corrections.length, 0);
    Assert.equal(corrections[0].word, 'headphones');

    const didYouMean = SpellCorrector.didYouMean('samsng hedphones');
    Assert.equal(didYouMean, 'samsung headphones');
  });

  it('should parse and evaluate boolean expressions and proximity phrases', () => {
    const docTokenPositions = new Map<string, number[]>([
      ['apple', [0]],
      ['wireless', [1]],
      ['headphones', [2]],
      ['pro', [3]],
    ]);

    // Phrase match
    const phraseAst = BooleanProximityParser.parse('"wireless headphones"');
    Assert.isTrue(BooleanProximityParser.evaluate(phraseAst, docTokenPositions));

    // Proximity match with slop 2 (apple at 0, headphones at 2 -> diff = 2 <= 2)
    const proxAst = BooleanProximityParser.parse('"apple headphones"~2');
    Assert.isTrue(BooleanProximityParser.evaluate(proxAst, docTokenPositions));

    // Boolean AND / NOT
    const andAst = BooleanProximityParser.parse('apple AND wireless');
    Assert.isTrue(BooleanProximityParser.evaluate(andAst, docTokenPositions));

    const notAst = BooleanProximityParser.parse('NOT samsung');
    Assert.isTrue(BooleanProximityParser.evaluate(notAst, docTokenPositions));
  });

  it('should perform vector semantic search and Reciprocal Rank Fusion (RRF)', () => {
    const vSearch = new VectorSemanticSearch();
    vSearch.indexDocument('doc-1', 'Apple iPhone 15 Pro Max Smartphone 256GB');
    vSearch.indexDocument('doc-2', 'Samsung Galaxy S24 Ultra Android Mobile');
    vSearch.indexDocument('doc-3', 'Sony Wireless Noise Cancelling Headphones');

    const vResults = vSearch.searchVector('Apple mobile phone', 5);
    Assert.equal(vResults[0].id, 'doc-1');
    Assert.greaterThan(vResults[0].score, 0.2);

    // Hybrid RRF Search
    const bm25Results = [
      { id: 'doc-1', score: 12.5 },
      { id: 'doc-2', score: 8.2 },
    ];
    const vectorResults = [
      { id: 'doc-2', score: 0.95 },
      { id: 'doc-1', score: 0.90 },
    ];

    const rrf = VectorSemanticSearch.reciprocalRankFusion(bm25Results, vectorResults, 60);
    Assert.equal(rrf.length, 2);
    Assert.isTrue(rrf[0].rrfScore > 0);
  });

  it('should compute disjunctive multi-select facets accurately', () => {
    const catalog: SearchItemDoc[] = [
      { id: '1', brand: 'Apple', category: 'Smartphones', price: 999, rating: 4.8, inStock: true },
      { id: '2', brand: 'Apple', category: 'Laptops', price: 1999, rating: 4.9, inStock: true },
      { id: '3', brand: 'Samsung', category: 'Smartphones', price: 899, rating: 4.7, inStock: true },
      { id: '4', brand: 'Sony', category: 'Audio', price: 349, rating: 4.6, inStock: false },
    ];

    // Select Brand: Apple
    const res = DisjunctiveFacetEngine.computeFacets(catalog, {
      brands: ['Apple'],
    });

    Assert.equal(res.filteredItems.length, 2);
    const brandFacet = res.facets.find((f) => f.dimension === 'brand')!;
    // Samsung and Sony must still appear with counts in disjunctive faceting
    Assert.isTrue(brandFacet.values.some((v) => v.value === 'Samsung' && v.count === 1));
    Assert.isTrue(brandFacet.values.some((v) => v.value === 'Apple' && v.count === 2 && v.isSelected));
  });

  it('should re-rank candidates with Bayesian smoothed CTR and user affinity', () => {
    const candidates = [
      { id: 'p1', score: 10.0, brand: 'Apple', category: 'Smartphones' },
      { id: 'p2', score: 9.8, brand: 'Samsung', category: 'Smartphones' },
    ];

    const metricsMap = new Map<string, ProductInteractionMetrics>([
      ['p1', { productId: 'p1', impressions: 100, clicks: 2, conversions: 0, brand: 'Apple', category: 'Smartphones' }], // 2% CTR
      ['p2', { productId: 'p2', impressions: 100, clicks: 25, conversions: 10, brand: 'Samsung', category: 'Smartphones' }], // 25% CTR
    ]);

    const userProfile: UserAffinityProfile = {
      userId: 'u-1',
      preferredCategories: new Map([['Smartphones', 0.8]]),
      preferredBrands: new Map([['Samsung', 1.0]]),
    };

    const reranked = ClickthroughReranker.rerank(candidates, metricsMap, userProfile);
    // p2 should jump ahead of p1 due to much higher CTR, conversions, and brand affinity
    Assert.equal(reranked[0].id, 'p2');
    Assert.greaterThan(reranked[0].score, reranked[1].score);
  });
});
