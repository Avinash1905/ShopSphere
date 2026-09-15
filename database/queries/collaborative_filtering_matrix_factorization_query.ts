export interface UserItemRating {
  userId: string;
  itemId: string;
  rating: number; // e.g. 1-5 stars or purchase frequency
}

export interface RecommendationPrediction {
  itemId: string;
  predictedAffinityScore: number;
  confidence: number;
}

export class CollaborativeFilteringMatrixFactorizationQueryEngine {
  private userFactors: Map<string, number[]> = new Map();
  private itemFactors: Map<string, number[]> = new Map();
  private latentDimensions: number;

  constructor(latentDimensions: number = 8) {
    this.latentDimensions = latentDimensions;
  }

  /**
   * Trains matrix factorization latent factors on interaction history using stochastic gradient descent
   */
  public train(ratings: UserItemRating[], iterations: number = 20, learningRate: number = 0.05, regularization: number = 0.02): void {
    // 1. Initialize random latent factors
    for (const r of ratings) {
      if (!this.userFactors.has(r.userId)) {
        this.userFactors.set(
          r.userId,
          Array.from({ length: this.latentDimensions }, () => Math.random() * 0.2 - 0.1)
        );
      }
      if (!this.itemFactors.has(r.itemId)) {
        this.itemFactors.set(
          r.itemId,
          Array.from({ length: this.latentDimensions }, () => Math.random() * 0.2 - 0.1)
        );
      }
    }

    // 2. Perform SGD iterations
    for (let iter = 0; iter < iterations; iter++) {
      for (const r of ratings) {
        const uVec = this.userFactors.get(r.userId)!;
        const iVec = this.itemFactors.get(r.itemId)!;

        // Predict
        let pred = 0;
        for (let d = 0; d < this.latentDimensions; d++) {
          pred += uVec[d] * iVec[d];
        }

        const err = r.rating - pred;

        // Update vectors
        for (let d = 0; d < this.latentDimensions; d++) {
          const uOld = uVec[d];
          const iOld = iVec[d];
          uVec[d] += learningRate * (err * iOld - regularization * uOld);
          iVec[d] += learningRate * (err * uOld - regularization * iOld);
        }
      }
    }
  }

  /**
   * Predicts top recommendations for a user across all catalog items
   */
  public recommendForUser(
    userId: string,
    candidateItemIds: string[],
    topN: number = 5
  ): RecommendationPrediction[] {
    const uVec = this.userFactors.get(userId);
    if (!uVec) {
      // Cold start: return candidate items with baseline score
      return candidateItemIds.slice(0, topN).map(id => ({
        itemId: id,
        predictedAffinityScore: 3.0,
        confidence: 0.1,
      }));
    }

    const predictions: RecommendationPrediction[] = [];

    for (const itemId of candidateItemIds) {
      const iVec = this.itemFactors.get(itemId);
      if (!iVec) continue;

      let score = 0;
      for (let d = 0; d < this.latentDimensions; d++) {
        score += uVec[d] * iVec[d];
      }

      predictions.push({
        itemId,
        predictedAffinityScore: Math.round(score * 100) / 100,
        confidence: 0.85,
      });
    }

    predictions.sort((a, b) => b.predictedAffinityScore - a.predictedAffinityScore);
    return predictions.slice(0, topN);
  }
}
