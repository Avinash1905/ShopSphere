import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import {
  ProductEmbeddingRepository,
  MultiArmedBanditRepository,
} from '../../database/repositories/index.js';
import {
  HNSWVectorGraphQueryEngine,
  CollaborativeFilteringMatrixFactorizationQueryEngine,
} from '../../database/queries/index.js';
import {
  RecommendationLiftEvaluator,
  RankedEvaluationSample,
} from '../../systems/analytics/index.js';
import {
  VectorSemanticReranker,
} from '../../systems/search/index.js';

describe('ML & Recommendation Systems Deep Dive (Phase 12)', () => {
  const db = new MockDatabaseAdapter();

  describe('ProductEmbeddingRepository', () => {
    const repo = new ProductEmbeddingRepository(db);

    it('should compute exact cosine similarity between orthogonal and parallel vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const vecC = [0, 1, 0];

      Assert.equal(ProductEmbeddingRepository.cosineSimilarity(vecA, vecB), 1.0);
      Assert.equal(ProductEmbeddingRepository.cosineSimilarity(vecA, vecC), 0.0);
    });

    it('should upsert embedding vector and find nearest neighbors', async () => {
      await repo.upsertEmbedding('var_test_01', [0.9, 0.1, -0.2], 'model_v1');
      await repo.upsertEmbedding('var_test_02', [0.88, 0.12, -0.19], 'model_v1');
      await repo.upsertEmbedding('var_test_03', [-0.5, 0.8, 0.4], 'model_v1');

      const neighbors = await repo.findNearestNeighbors([0.9, 0.1, -0.2], 2, 'model_v1');
      Assert.isTrue(neighbors.length > 0);
      Assert.equal(neighbors[0].variantId, 'var_test_01');
      Assert.equal(neighbors[0].cosineSimilarity, 1.0);
      Assert.equal(neighbors[1].variantId, 'var_test_02');
      Assert.isTrue(neighbors[1].cosineSimilarity > 0.95);
    });
  });

  describe('MultiArmedBanditRepository', () => {
    const repo = new MultiArmedBanditRepository(db);

    it('should select arm via Thompson sampling and update feedback', async () => {
      await repo.recordFeedback('camp_test_01', 'arm_banner_A', true, 100);
      await repo.recordFeedback('camp_test_01', 'arm_banner_B', false, 0);

      const selection = await repo.selectArmThompsonSampling('camp_test_01');
      Assert.isTrue(!!selection);
      Assert.isTrue(['arm_banner_A', 'arm_banner_B'].includes(selection.selectedArmKey));
      Assert.isTrue(selection.sampledScore >= 0 && selection.sampledScore <= 1);
    });
  });

  describe('HNSWVectorGraphQueryEngine', () => {
    it('should build multi-layer graph and execute KNN nearest neighbor query', () => {
      const hnsw = new HNSWVectorGraphQueryEngine(3, 8, 16);

      hnsw.addNode('node_laptop_01', [1.0, 0.2, 0.1], 2);
      hnsw.addNode('node_laptop_02', [0.95, 0.25, 0.15], 1);
      hnsw.addNode('node_phone_01', [0.1, 0.9, 0.8], 1);
      hnsw.addNode('node_phone_02', [0.15, 0.85, 0.75], 0);

      Assert.equal(hnsw.size(), 4);

      const query = [1.0, 0.2, 0.1];
      const results = hnsw.searchKnn(query, 2);

      Assert.equal(results.length, 2);
      Assert.equal(results[0].id, 'node_laptop_01');
      Assert.equal(results[0].distance, 0.0);
      Assert.equal(results[0].similarityScore, 1.0);
      Assert.equal(results[1].id, 'node_laptop_02');
    });
  });

  describe('CollaborativeFilteringMatrixFactorizationQueryEngine', () => {
    it('should train matrix factorization model and predict user recommendations', () => {
      const model = new CollaborativeFilteringMatrixFactorizationQueryEngine(4);

      const ratings = [
        { userId: 'u1', itemId: 'item_laptop', rating: 5 },
        { userId: 'u1', itemId: 'item_dock', rating: 5 },
        { userId: 'u2', itemId: 'item_laptop', rating: 4 },
        { userId: 'u2', itemId: 'item_dock', rating: 4 },
        { userId: 'u3', itemId: 'item_dress', rating: 5 },
        { userId: 'u3', itemId: 'item_shoes', rating: 5 },
      ];

      model.train(ratings, 30, 0.05, 0.01);

      const recsForU1 = model.recommendForUser('u1', ['item_laptop', 'item_dock', 'item_dress', 'item_shoes'], 3);
      Assert.isTrue(recsForU1.length > 0);
      Assert.isTrue(recsForU1[0].predictedAffinityScore > 0);
    });
  });

  describe('RecommendationLiftEvaluator', () => {
    it('should calculate MRR, NDCG@K, Precision, and Recall ranking metrics', () => {
      const samples: RankedEvaluationSample[] = [
        {
          userId: 'u1',
          recommendedItemIds: ['item_A', 'item_B', 'item_C', 'item_D', 'item_E'],
          actualInteractedItemIds: ['item_A', 'item_C'],
          relevanceScores: { item_A: 3, item_B: 0, item_C: 2, item_D: 0, item_E: 0 },
        },
        {
          userId: 'u2',
          recommendedItemIds: ['item_X', 'item_Y', 'item_Z', 'item_W', 'item_V'],
          actualInteractedItemIds: ['item_Y'],
          relevanceScores: { item_X: 0, item_Y: 3, item_Z: 0, item_W: 0, item_V: 0 },
        },
      ];

      const metrics = RecommendationLiftEvaluator.evaluateModelPerformance(samples, 5, 2.5, 4.0);
      Assert.isTrue(!!metrics);
      Assert.equal(metrics.totalEvaluatedUsers, 2);
      Assert.isTrue(metrics.meanReciprocalRankMrr > 0.7); // (1.0 + 0.5) / 2 = 0.75
      Assert.isTrue(metrics.ndcgAtK > 0.6);
      Assert.isTrue(metrics.precisionAtK > 0);
      Assert.isTrue(metrics.recallAtK > 0);
      Assert.equal(metrics.clickThroughRateLiftPercent, 60.0); // (4.0 - 2.5) / 2.5 * 100 = 60%
    });
  });

  describe('VectorSemanticReranker', () => {
    it('should rerank candidates using dense vector cosine similarity and sparse BM25 fusion', () => {
      const queryVec = [1.0, 0.0, 0.0];
      const candidates = [
        { variantId: 'v1', sku: 'SKU-01', lexicalBm25Score: 8.5, productVector: [0.1, 0.9, 0.0] }, // High BM25, Low Vector
        { variantId: 'v2', sku: 'SKU-02', lexicalBm25Score: 7.0, productVector: [0.99, 0.05, 0.0] }, // High Vector, Medium BM25
        { variantId: 'v3', sku: 'SKU-03', lexicalBm25Score: 2.0, productVector: [0.2, 0.1, 0.9] }, // Low both
      ];

      const reranked = VectorSemanticReranker.rerankCandidates(queryVec, candidates, 0.7);
      Assert.equal(reranked.length, 3);
      Assert.equal(reranked[0].variantId, 'v2'); // High neural semantic alignment ranks top
      Assert.equal(reranked[0].rerankedPosition, 1);
      Assert.isTrue(reranked[0].finalFusedScore >= reranked[1].finalFusedScore);
    });
  });
});
