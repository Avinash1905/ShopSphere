/**
 * ShopSphere Search Engine - Click-Through Rate (CTR) & Affinity Learning-to-Rank Re-Ranker
 * Features:
 * - Bayesian smoothed CTR calculation:
 *   $$\text{CTR}_{\text{smoothed}} = \frac{\text{clicks} + \alpha \cdot \text{prior}}{\text{impressions} + \alpha}$$
 * - User Category & Brand Affinity Boost
 * - Combined linear scoring with BM25 base score
 */

export interface ProductInteractionMetrics {
  productId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  brand: string;
  category: string;
}

export interface UserAffinityProfile {
  userId: string;
  preferredCategories: Map<string, number>; // category -> affinity weight (0.0 to 1.0)
  preferredBrands: Map<string, number>; // brand -> affinity weight (0.0 to 1.0)
}

export class ClickthroughReranker {
  private static alpha = 10; // Smoothing factor
  private static priorCTR = 0.05; // 5% baseline prior

  /**
   * Calculates Bayesian smoothed CTR
   */
  public static calculateSmoothedCTR(clicks: number, impressions: number): number {
    return (clicks + this.alpha * this.priorCTR) / (impressions + this.alpha);
  }

  /**
   * Re-ranks search candidates by blending BM25 score, CTR, and user affinity
   */
  public static rerank<T extends { id: string; score: number; brand?: string; category?: string }>(
    candidates: T[],
    metricsMap: Map<string, ProductInteractionMetrics>,
    userProfile?: UserAffinityProfile
  ): T[] {
    const scored = candidates.map((item) => {
      const metrics = metricsMap.get(item.id);
      let ctrScore = this.priorCTR;
      let conversionMultiplier = 1.0;

      if (metrics) {
        ctrScore = this.calculateSmoothedCTR(metrics.clicks, metrics.impressions);
        if (metrics.conversions > 0) {
          conversionMultiplier += Math.min(metrics.conversions * 0.05, 0.5); // Up to +50% boost
        }
      }

      let affinityMultiplier = 1.0;
      if (userProfile) {
        if (item.category && userProfile.preferredCategories.has(item.category)) {
          affinityMultiplier += userProfile.preferredCategories.get(item.category)! * 0.3;
        }
        if (item.brand && userProfile.preferredBrands.has(item.brand)) {
          affinityMultiplier += userProfile.preferredBrands.get(item.brand)! * 0.2;
        }
      }

      // Blended score formula: BM25 * (1 + CTR_score * 2) * ConversionBoost * AffinityBoost
      const finalScore = item.score * (1.0 + ctrScore * 2.0) * conversionMultiplier * affinityMultiplier;

      return {
        item,
        finalScore,
      };
    });

    return scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .map((s) => ({
        ...s.item,
        score: Math.round(s.finalScore * 1000) / 1000,
      }));
  }
}
