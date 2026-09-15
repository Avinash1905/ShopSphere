export interface SparseMatchResult {
  id: string;
  bm25Score: number;
  rank: number;
}

export interface DenseMatchResult {
  id: string;
  cosineSimilarity: number;
  rank: number;
}

export interface FusedSearchResult {
  id: string;
  fusedScore: number;
  sparseRank?: number;
  denseRank?: number;
  sparseRawScore?: number;
  denseRawScore?: number;
  normalizedSparseScore: number;
  normalizedDenseScore: number;
  fusionMethod: 'RECIPROCAL_RANK_FUSION' | 'CONVEX_COMBINATION';
}

export class HybridDenseSparseFusionEngine {
  /**
   * Reciprocal Rank Fusion (RRF) algorithm: score(d) = sum_m 1 / (k + rank_m(d))
   * Default k = 60 (standard industry constant)
   */
  public static fuseRRF(
    sparseResults: SparseMatchResult[],
    denseResults: DenseMatchResult[],
    k: number = 60
  ): FusedSearchResult[] {
    const scoreMap = new Map<string, {
      sparseRank?: number;
      denseRank?: number;
      sparseRaw?: number;
      denseRaw?: number;
      rrfScore: number;
    }>();

    // 1. Process sparse list
    for (let i = 0; i < sparseResults.length; i++) {
      const item = sparseResults[i];
      const rank = item.rank || i + 1;
      const rrfContribution = 1.0 / (k + rank);

      scoreMap.set(item.id, {
        sparseRank: rank,
        sparseRaw: item.bm25Score,
        rrfScore: rrfContribution,
      });
    }

    // 2. Process dense list
    for (let i = 0; i < denseResults.length; i++) {
      const item = denseResults[i];
      const rank = item.rank || i + 1;
      const rrfContribution = 1.0 / (k + rank);

      if (scoreMap.has(item.id)) {
        const existing = scoreMap.get(item.id)!;
        existing.denseRank = rank;
        existing.denseRaw = item.cosineSimilarity;
        existing.rrfScore += rrfContribution;
      } else {
        scoreMap.set(item.id, {
          denseRank: rank,
          denseRaw: item.cosineSimilarity,
          rrfScore: rrfContribution,
        });
      }
    }

    const fused: FusedSearchResult[] = [];
    for (const [id, data] of scoreMap.entries()) {
      fused.push({
        id,
        fusedScore: Math.round(data.rrfScore * 10000) / 10000,
        sparseRank: data.sparseRank,
        denseRank: data.denseRank,
        sparseRawScore: data.sparseRaw,
        denseRawScore: data.denseRaw,
        normalizedSparseScore: data.sparseRank ? Math.round((1.0 / (k + data.sparseRank)) * 10000) / 10000 : 0,
        normalizedDenseScore: data.denseRank ? Math.round((1.0 / (k + data.denseRank)) * 10000) / 10000 : 0,
        fusionMethod: 'RECIPROCAL_RANK_FUSION',
      });
    }

    fused.sort((a, b) => b.fusedScore - a.fusedScore);
    return fused;
  }

  /**
   * Linear Convex Combination: alpha * Norm(BM25) + (1 - alpha) * Norm(Cosine)
   * alpha defaults to 0.65 (slight lexical bias for e-commerce exact SKU/title match)
   */
  public static fuseConvex(
    sparseResults: SparseMatchResult[],
    denseResults: DenseMatchResult[],
    alpha: number = 0.65
  ): FusedSearchResult[] {
    // Normalize sparse scores to [0, 1]
    const maxSparse = Math.max(...sparseResults.map((s) => s.bm25Score), 1.0);
    const minSparse = Math.min(...sparseResults.map((s) => s.bm25Score), 0.0);
    const sparseRange = maxSparse - minSparse || 1.0;

    // Normalize dense scores to [0, 1]
    const maxDense = Math.max(...denseResults.map((d) => d.cosineSimilarity), 1.0);
    const minDense = Math.min(...denseResults.map((d) => d.cosineSimilarity), 0.0);
    const denseRange = maxDense - minDense || 1.0;

    const candidateMap = new Map<string, {
      sparseNorm: number;
      denseNorm: number;
      sparseRaw?: number;
      denseRaw?: number;
      sparseRank?: number;
      denseRank?: number;
    }>();

    for (let i = 0; i < sparseResults.length; i++) {
      const s = sparseResults[i];
      const norm = Math.max(0, (s.bm25Score - minSparse) / sparseRange);
      candidateMap.set(s.id, {
        sparseNorm: norm,
        denseNorm: 0,
        sparseRaw: s.bm25Score,
        sparseRank: s.rank || i + 1,
      });
    }

    for (let i = 0; i < denseResults.length; i++) {
      const d = denseResults[i];
      const norm = Math.max(0, (d.cosineSimilarity - minDense) / denseRange);
      if (candidateMap.has(d.id)) {
        const entry = candidateMap.get(d.id)!;
        entry.denseNorm = norm;
        entry.denseRaw = d.cosineSimilarity;
        entry.denseRank = d.rank || i + 1;
      } else {
        candidateMap.set(d.id, {
          sparseNorm: 0,
          denseNorm: norm,
          denseRaw: d.cosineSimilarity,
          denseRank: d.rank || i + 1,
        });
      }
    }

    const fused: FusedSearchResult[] = [];
    for (const [id, data] of candidateMap.entries()) {
      const combined = alpha * data.sparseNorm + (1 - alpha) * data.denseNorm;
      fused.push({
        id,
        fusedScore: Math.round(combined * 1000) / 1000,
        sparseRank: data.sparseRank,
        denseRank: data.denseRank,
        sparseRawScore: data.sparseRaw,
        denseRawScore: data.denseRaw,
        normalizedSparseScore: Math.round(data.sparseNorm * 1000) / 1000,
        normalizedDenseScore: Math.round(data.denseNorm * 1000) / 1000,
        fusionMethod: 'CONVEX_COMBINATION',
      });
    }

    fused.sort((a, b) => b.fusedScore - a.fusedScore);
    return fused;
  }
}
