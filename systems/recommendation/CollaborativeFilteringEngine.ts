export class CollaborativeFilteringEngine {
  public static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length || vectorA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return +(dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4);
  }

  public static rankRelatedItems(targetItemVector: number[], candidates: { id: string; vector: number[] }[]): { id: string; score: number }[] {
    return candidates
      .map(c => ({ id: c.id, score: this.cosineSimilarity(targetItemVector, c.vector) }))
      .sort((a, b) => b.score - a.score);
  }
}
