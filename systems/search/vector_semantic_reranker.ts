import { ProductEmbeddingRepository } from '../../database/repositories/product_embedding_repository.js';

export interface CandidateSearchResult {
  variantId: string;
  sku: string;
  lexicalBm25Score: number;
  productVector?: number[];
}

export interface HybridRerankedResult {
  variantId: string;
  sku: string;
  finalFusedScore: number;
  normalizedBm25Score: number;
  normalizedVectorScore: number;
  rerankedPosition: number;
}

export class VectorSemanticReranker {
  /**
   * Reranks candidate search items using dense neural vector embeddings + sparse BM25 fusion
   */
  public static rerankCandidates(
    queryVector: number[],
    candidates: CandidateSearchResult[],
    denseWeightAlpha: number = 0.65 // 65% neural, 35% keyword
  ): HybridRerankedResult[] {
    if (candidates.length === 0) return [];

    // 1. Calculate vector similarities and find min/max for normalization
    let maxBm25 = -Infinity;
    let minBm25 = Infinity;
    let maxVec = -Infinity;
    let minVec = Infinity;

    const computedItems = candidates.map(c => {
      const vecSim = c.productVector
        ? ProductEmbeddingRepository.cosineSimilarity(queryVector, c.productVector)
        : 0;

      if (c.lexicalBm25Score > maxBm25) maxBm25 = c.lexicalBm25Score;
      if (c.lexicalBm25Score < minBm25) minBm25 = c.lexicalBm25Score;

      if (vecSim > maxVec) maxVec = vecSim;
      if (vecSim < minVec) minVec = vecSim;

      return {
        ...c,
        rawVecSim: vecSim,
      };
    });

    const bm25Range = maxBm25 - minBm25 > 0 ? maxBm25 - minBm25 : 1;
    const vecRange = maxVec - minVec > 0 ? maxVec - minVec : 1;

    // 2. Perform min-max normalization and convex combination
    const reranked: HybridRerankedResult[] = computedItems.map(item => {
      const normBm25 = (item.lexicalBm25Score - minBm25) / bm25Range;
      const normVec = (item.rawVecSim - minVec) / vecRange;
      const fusedScore = denseWeightAlpha * normVec + (1 - denseWeightAlpha) * normBm25;

      return {
        variantId: item.variantId,
        sku: item.sku,
        finalFusedScore: Math.round(fusedScore * 10000) / 10000,
        normalizedBm25Score: Math.round(normBm25 * 10000) / 10000,
        normalizedVectorScore: Math.round(normVec * 10000) / 10000,
        rerankedPosition: 0,
      };
    });

    reranked.sort((a, b) => b.finalFusedScore - a.finalFusedScore);

    for (let i = 0; i < reranked.length; i++) {
      reranked[i].rerankedPosition = i + 1;
    }

    return reranked;
  }
}
