import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import {
  AutocompleteTrieEngine,
  GeoSpatialSearchEngine,
  HybridDenseSparseFusionEngine,
  QueryIntentClassifier,
  DynamicFacetAggregator,
  SearchABTestingFramework,
  PersonalizedCollaborativeReranker,
  NegativeKeywordGuard,
  SearchIndexSnapshotManager,
  ExplainableSearchDebugger,
} from '../../systems/search/index.js';

describe('Phase 5: Search Subsystem Deep Dive & Relevance Engineering', () => {
  it('should provide weighted prefix and fuzzy suggestions via AutocompleteTrieEngine', () => {
    const trie = new AutocompleteTrieEngine();
    trie.insert('apple macbook pro', 150, { category: 'laptops' });
    trie.insert('apple iphone 16', 200, { category: 'smartphones' });
    trie.insert('apple watch ultra', 80, { category: 'wearables' });
    trie.insert('appliances kitchen', 45, { category: 'home' });

    const suggestions = trie.suggest('apple');
    Assert.equal(suggestions.length, 3);
    Assert.equal(suggestions[0].phrase, 'apple iphone 16'); // Highest frequency
    Assert.equal(suggestions[1].phrase, 'apple macbook pro');

    const fuzzy = trie.fuzzySuggest('aple');
    Assert.greaterThan(fuzzy.length, 0);
    Assert.isTrue(fuzzy.some((f) => f.phrase.includes('apple')));
  });

  it('should index and perform radius search with Gaussian proximity decay via GeoSpatialSearchEngine', () => {
    const geo = new GeoSpatialSearchEngine();
    // San Francisco Hub
    geo.index({
      id: 'wh-sf',
      title: 'SF Downtown Fulfillment Hub',
      location: { latitude: 37.7749, longitude: -122.4194 },
      serviceableRadiusKm: 30,
    });
    // Oakland Hub (~12km away)
    geo.index({
      id: 'wh-oak',
      title: 'Oakland East Bay Hub',
      location: { latitude: 37.8044, longitude: -122.2712 },
      serviceableRadiusKm: 25,
    });
    // San Jose Hub (~65km away)
    geo.index({
      id: 'wh-sj',
      title: 'San Jose South Bay Hub',
      location: { latitude: 37.3382, longitude: -121.8863 },
      serviceableRadiusKm: 40,
    });

    const results = geo.searchRadius({ latitude: 37.7749, longitude: -122.4194 }, 50);
    Assert.equal(results.length, 2, 'SF and Oakland within 50km');
    Assert.equal(results[0].id, 'wh-sf');
    Assert.equal(results[0].distanceKm, 0);
    Assert.equal(results[0].geoDecayScore, 1.0);
    Assert.greaterThan(results[1].distanceKm, 0);
    Assert.lessThan(results[1].geoDecayScore, 1.0);
  });

  it('should fuse lexical BM25 and dense vector results via RRF and Convex Combination', () => {
    const sparse = [
      { id: 'doc-1', bm25Score: 12.5, rank: 1 },
      { id: 'doc-2', bm25Score: 9.8, rank: 2 },
      { id: 'doc-3', bm25Score: 4.2, rank: 3 },
    ];
    const dense = [
      { id: 'doc-2', cosineSimilarity: 0.92, rank: 1 },
      { id: 'doc-4', cosineSimilarity: 0.88, rank: 2 },
      { id: 'doc-1', cosineSimilarity: 0.81, rank: 3 },
    ];

    const rrf = HybridDenseSparseFusionEngine.fuseRRF(sparse, dense);
    Assert.equal(rrf.length, 4);
    Assert.isTrue(rrf[0].fusedScore > 0);

    const convex = HybridDenseSparseFusionEngine.fuseConvex(sparse, dense, 0.6);
    Assert.equal(convex.length, 4);
    Assert.isTrue(convex[0].fusedScore > 0);
  });

  it('should classify search intent and extract price/brand entities via QueryIntentClassifier', () => {
    const analysis = QueryIntentClassifier.analyze('apple macbook pro under $2000 space black');
    Assert.equal(analysis.primaryIntent, 'PRICE_SENSITIVE');
    Assert.isTrue(analysis.entities.detectedBrands.includes('apple'));
    Assert.isTrue(analysis.entities.detectedColors.includes('space black'));
    Assert.equal(analysis.entities.maxPrice, 2000);
    Assert.equal(analysis.inferredFilters.maxPrice, 2000);

    const brandOnly = QueryIntentClassifier.analyze('sony');
    Assert.equal(brandOnly.primaryIntent, 'BRAND_SEARCH');
  });

  it('should aggregate multi-dimensional facets and price histograms via DynamicFacetAggregator', () => {
    const sampleDocs = [
      { id: '1', brand: 'Apple', category: 'Laptops', price: 1999, rating: 4.8, inStock: true },
      { id: '2', brand: 'Apple', category: 'Smartphones', price: 1199, rating: 4.9, inStock: true },
      { id: '3', brand: 'Sony', category: 'Headphones', price: 349, rating: 4.6, inStock: false },
      { id: '4', brand: 'Nike', category: 'Shoes', price: 160, rating: 4.5, inStock: true },
    ];

    const overview = DynamicFacetAggregator.aggregate(sampleDocs, { brands: ['Apple'] });
    Assert.equal(overview.totalMatchingDocuments, 4);
    const brandFacet = overview.facets.find((f) => f.dimension === 'brands');
    Assert.isTrue(brandFacet !== undefined);
    Assert.equal(brandFacet!.buckets.find((b) => b.value === 'Apple')?.count, 2);
    Assert.isTrue(brandFacet!.buckets.find((b) => b.value === 'Apple')?.selected === true);
  });

  it('should assign deterministic variants and record conversion events via SearchABTestingFramework', () => {
    const ab = new SearchABTestingFramework();
    ab.registerExperiment({
      experimentId: 'exp-bm25-vs-vector',
      name: 'Ranking Alg Benchmark',
      description: 'Testing BM25 vs Vector hybrid',
      status: 'ACTIVE',
      variants: [
        { variantId: 'control', name: 'BM25 Baseline', weight: 50, configuration: { rankingAlgorithm: 'DEFAULT_BM25' } },
        { variantId: 'treatment', name: 'Hybrid Vector', weight: 50, configuration: { rankingAlgorithm: 'HYBRID_VECTOR' } },
      ],
    });

    const v1 = ab.assignVariant('exp-bm25-vs-vector', 'usr-12345');
    const v2 = ab.assignVariant('exp-bm25-vs-vector', 'usr-12345');
    Assert.equal(v1?.variantId, v2?.variantId, 'Deterministic assignment for same user');

    ab.trackEvent('exp-bm25-vs-vector', 'treatment', 'IMPRESSION');
    ab.trackEvent('exp-bm25-vs-vector', 'treatment', 'CLICK');
    ab.trackEvent('exp-bm25-vs-vector', 'treatment', 'CONVERSION', 250);

    const results = ab.getExperimentResults('exp-bm25-vs-vector');
    const treatmentRes = results.find((r) => r.variantId === 'treatment')!;
    Assert.equal(treatmentRes.clicks, 1);
    Assert.equal(treatmentRes.conversions, 1);
    Assert.equal(treatmentRes.revenue, 250);
    Assert.equal(treatmentRes.conversionRatePercent, 100);
  });

  it('should personalize and boost rankings based on user affinities via PersonalizedCollaborativeReranker', () => {
    const candidates = [
      { id: 'item-1', title: 'Running Shoes', brand: 'nike', category: 'shoes', price: 140, baseRankScore: 10.0 },
      { id: 'item-2', title: 'Wireless Headphones', brand: 'sony', category: 'audio', price: 300, baseRankScore: 10.0 },
      { id: 'item-3', title: 'MacBook M3', brand: 'apple', category: 'laptops', price: 2000, baseRankScore: 9.5 },
    ];

    const profile = {
      userId: 'usr-athlete',
      favoriteCategories: new Map([['shoes', 0.9]]),
      favoriteBrands: new Map([['nike', 0.8]]),
      preferredPriceTier: 'MID_RANGE' as const,
      pastPurchasedProductIds: new Set<string>(),
      recentlyViewedProductIds: ['item-1'],
    };

    const reranked = PersonalizedCollaborativeReranker.rerank(candidates, profile);
    Assert.equal(reranked[0].id, 'item-1', 'Running shoes boosted to #1 rank for athlete profile');
    Assert.greaterThan(reranked[0].personalizedScore, reranked[0].baseRankScore);
    Assert.greaterThan(reranked[0].boostReasons.length, 0);
  });

  it('should parse negation and filter excluded/prohibited items via NegativeKeywordGuard', () => {
    const parsed = NegativeKeywordGuard.parse('laptop -refurbished -broken NOT used fake');
    Assert.equal(parsed.positiveQuery, 'laptop');
    Assert.isTrue(parsed.negatedTokens.includes('refurbished'));
    Assert.isTrue(parsed.negatedTokens.includes('broken'));
    Assert.isTrue(parsed.negatedTokens.includes('used'));
    Assert.isTrue(parsed.isProhibitedQuery, 'Fake keyword flagged');

    const docs = [
      { id: '1', title: 'Brand New Apple MacBook Laptop', description: 'Factory sealed' },
      { id: '2', title: 'Refurbished Dell XPS Laptop', description: 'Certified refurbished' },
    ];

    const filtered = NegativeKeywordGuard.filterNegated(docs, parsed.negatedTokens);
    Assert.equal(filtered.length, 1);
    Assert.equal(filtered[0].id, '1');
  });

  it('should create verifiable snapshots and execute blue/green hot swaps via SearchIndexSnapshotManager', () => {
    const manager = new SearchIndexSnapshotManager();
    const snap = manager.createSnapshot(
      { laptop: [{ docId: 'doc-1', termFrequency: 2, positions: [0, 4] }] },
      { 'doc-1': { id: 'doc-1', title: 'MacBook Pro' } }
    );

    Assert.equal(snap.metadata.version, 1);
    Assert.equal(snap.metadata.totalDocuments, 1);

    const initialSlot = manager.getActiveSlot();
    const restored = manager.restoreSnapshot(snap);
    Assert.isTrue(restored);
    Assert.notEqual(manager.getActiveSlot(), initialSlot, 'Switched active slot (Blue <-> Green)');
    Assert.equal(manager.getActiveDocumentCount(), 1);
  });

  it('should provide transparent BM25 term and business factor score breakdowns via ExplainableSearchDebugger', () => {
    const explanation = ExplainableSearchDebugger.explain(
      'prod-mbp',
      'Apple MacBook Pro 16 M3 Max',
      ['macbook', 'pro'],
      { rating: 4.9, salesCount: 1500, inStock: true }
    );

    Assert.equal(explanation.documentId, 'prod-mbp');
    Assert.greaterThan(explanation.totalCompositeScore, explanation.baseLexicalScore);
    Assert.equal(explanation.termBreakdowns.length, 2);
    Assert.equal(explanation.termBreakdowns[0].matchedField, 'TITLE');
    Assert.isTrue(explanation.explanationNarrative.includes('MacBook'));
  });
});
