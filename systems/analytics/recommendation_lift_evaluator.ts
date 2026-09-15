export interface RankedEvaluationSample {
  userId: string;
  recommendedItemIds: string[];
  actualInteractedItemIds: string[];
  relevanceScores: Record<string, number>; // item -> relevance (e.g. 1-5)
}

export interface RecommendationMetricsReport {
  totalEvaluatedUsers: number;
  kThreshold: number;
  meanReciprocalRankMrr: number;
  ndcgAtK: number;
  precisionAtK: number;
  recallAtK: number;
  clickThroughRateLiftPercent?: number;
}

export class RecommendationLiftEvaluator {
  /**
   * Calculates Mean Reciprocal Rank (MRR)
   */
  public static calculateMRR(samples: RankedEvaluationSample[]): number {
    if (samples.length === 0) return 0;

    let reciprocalRankSum = 0;
    for (const sample of samples) {
      const interactedSet = new Set(sample.actualInteractedItemIds);
      let rank = 0;
      for (let i = 0; i < sample.recommendedItemIds.length; i++) {
        if (interactedSet.has(sample.recommendedItemIds[i])) {
          rank = i + 1;
          break;
        }
      }
      if (rank > 0) {
        reciprocalRankSum += 1.0 / rank;
      }
    }

    return Math.round((reciprocalRankSum / samples.length) * 10000) / 10000;
  }

  /**
   * Calculates Normalized Discounted Cumulative Gain at K (NDCG@K)
   */
  public static calculateNDCG(samples: RankedEvaluationSample[], k: number = 5): number {
    if (samples.length === 0) return 0;

    let ndcgSum = 0;

    for (const sample of samples) {
      // 1. DCG@K
      let dcg = 0;
      const topKRecs = sample.recommendedItemIds.slice(0, k);
      for (let i = 0; i < topKRecs.length; i++) {
        const item = topKRecs[i];
        const rel = sample.relevanceScores[item] || (sample.actualInteractedItemIds.includes(item) ? 1.0 : 0.0);
        dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
      }

      // 2. IDCG@K (Ideal DCG)
      const idealRels = Object.values(sample.relevanceScores).sort((a, b) => b - a).slice(0, k);
      let idcg = 0;
      for (let i = 0; i < idealRels.length; i++) {
        idcg += (Math.pow(2, idealRels[i]) - 1) / Math.log2(i + 2);
      }

      if (idcg > 0) {
        ndcgSum += dcg / idcg;
      }
    }

    return Math.round((ndcgSum / samples.length) * 10000) / 10000;
  }

  /**
   * Generates comprehensive ranking and lift metrics report
   */
  public static evaluateModelPerformance(
    samples: RankedEvaluationSample[],
    k: number = 5,
    controlCtrPercent?: number,
    modelCtrPercent?: number
  ): RecommendationMetricsReport {
    const mrr = this.calculateMRR(samples);
    const ndcg = this.calculateNDCG(samples, k);

    let precisionSum = 0;
    let recallSum = 0;

    for (const sample of samples) {
      const topK = sample.recommendedItemIds.slice(0, k);
      const relevantSet = new Set(sample.actualInteractedItemIds);
      let hits = 0;

      for (const item of topK) {
        if (relevantSet.has(item)) hits++;
      }

      precisionSum += topK.length > 0 ? hits / topK.length : 0;
      recallSum += relevantSet.size > 0 ? hits / relevantSet.size : 0;
    }

    const precision = samples.length > 0 ? Math.round((precisionSum / samples.length) * 10000) / 10000 : 0;
    const recall = samples.length > 0 ? Math.round((recallSum / samples.length) * 10000) / 10000 : 0;

    let ctrLift: number | undefined;
    if (controlCtrPercent !== undefined && modelCtrPercent !== undefined && controlCtrPercent > 0) {
      ctrLift = Math.round(((modelCtrPercent - controlCtrPercent) / controlCtrPercent) * 10000) / 100;
    }

    return {
      totalEvaluatedUsers: samples.length,
      kThreshold: k,
      meanReciprocalRankMrr: mrr,
      ndcgAtK: ndcg,
      precisionAtK: precision,
      recallAtK: recall,
      clickThroughRateLiftPercent: ctrLift,
    };
  }
}
