/**
 * ShopSphere Search Engine - Vector Semantic Search & Reciprocal Rank Fusion (RRF)
 * Features:
 * - Dense vector representation of text documents using vocabulary hashing & TF-IDF
 * - Cosine similarity vector search
 * - Hybrid Search using Reciprocal Rank Fusion (RRF):
 *   $$RRF(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$ (with constant $k=60$)
 */

export interface VectorDocument {
  id: string;
  vector: number[];
  payload?: any;
}

export interface HybridSearchResult {
  id: string;
  bm25Rank: number;
  vectorRank: number;
  rrfScore: number;
  payload?: any;
}

export class VectorSemanticSearch {
  private static vectorDim = 64;
  private documents: Map<string, VectorDocument> = new Map();

  /**
   * Generates a dense normalized pseudo-embedding vector for text
   */
  public static textToVector(text: string): number[] {
    const vector = new Array(this.vectorDim).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    if (words.length === 0) return vector;

    for (const word of words) {
      // Hash word to dimension index
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const dim = Math.abs(hash) % this.vectorDim;
      vector[dim] += 1.0 / Math.sqrt(words.length);
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.vectorDim; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.vectorDim; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Calculates Cosine Similarity between two vectors:
   * $$\text{CosineSim}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$
   */
  public static cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  public indexDocument(id: string, text: string, payload?: any): void {
    const vector = VectorSemanticSearch.textToVector(text);
    this.documents.set(id, { id, vector, payload });
  }

  /**
   * Performs k-NN vector search
   */
  public searchVector(queryText: string, topK: number = 10): Array<{ id: string; score: number; payload?: any }> {
    const queryVec = VectorSemanticSearch.textToVector(queryText);
    const results: Array<{ id: string; score: number; payload?: any }> = [];

    for (const [id, doc] of this.documents) {
      const score = VectorSemanticSearch.cosineSimilarity(queryVec, doc.vector);
      results.push({ id, score, payload: doc.payload });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * Computes Reciprocal Rank Fusion (RRF) between BM25 search rankings and Vector rankings
   */
  public static reciprocalRankFusion(
    bm25Results: Array<{ id: string; score: number; payload?: any }>,
    vectorResults: Array<{ id: string; score: number; payload?: any }>,
    k: number = 60
  ): HybridSearchResult[] {
    const rrfScores = new Map<string, { bm25Rank: number; vectorRank: number; score: number; payload?: any }>();

    // 1. Process BM25 ranks
    bm25Results.forEach((res, rankIdx) => {
      const rank = rankIdx + 1;
      rrfScores.set(res.id, {
        bm25Rank: rank,
        vectorRank: 999, // default unranked
        score: 1.0 / (k + rank),
        payload: res.payload,
      });
    });

    // 2. Process Vector ranks
    vectorResults.forEach((res, rankIdx) => {
      const rank = rankIdx + 1;
      if (rrfScores.has(res.id)) {
        const item = rrfScores.get(res.id)!;
        item.vectorRank = rank;
        item.score += 1.0 / (k + rank);
      } else {
        rrfScores.set(res.id, {
          bm25Rank: 999,
          vectorRank: rank,
          score: 1.0 / (k + rank),
          payload: res.payload,
        });
      }
    });

    return Array.from(rrfScores.entries())
      .map(([id, info]) => ({
        id,
        bm25Rank: info.bm25Rank,
        vectorRank: info.vectorRank,
        rrfScore: info.score,
        payload: info.payload,
      }))
      .sort((a, b) => b.rrfScore - a.rrfScore);
  }
}
