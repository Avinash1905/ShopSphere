export interface SearchExperimentVariant {
  variantId: string;
  name: string;
  weight: number; // 0 to 100
  configuration: {
    rankingAlgorithm: 'DEFAULT_BM25' | 'HYBRID_VECTOR' | 'MARGIN_OPTIMIZED' | 'PERSONALIZED';
    bm25Weight?: number;
    vectorWeight?: number;
    ctrBoostWeight?: number;
    marginBoostWeight?: number;
  };
}

export interface SearchExperiment {
  experimentId: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CONCLUDED';
  variants: SearchExperimentVariant[];
  targetQueryPrefix?: string;
  startedAt?: string;
}

export interface ExperimentMetrics {
  experimentId: string;
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctrPercent: number;
  conversionRatePercent: number;
  averageOrderValue: number;
}

export class SearchABTestingFramework {
  private experiments: Map<string, SearchExperiment> = new Map();
  private metrics: Map<string, { impressions: number; clicks: number; conversions: number; revenue: number }> = new Map();

  /**
   * Registers a new search A/B test experiment
   */
  public registerExperiment(experiment: SearchExperiment): void {
    this.experiments.set(experiment.experimentId, experiment);
    for (const v of experiment.variants) {
      const key = `${experiment.experimentId}:${v.variantId}`;
      if (!this.metrics.has(key)) {
        this.metrics.set(key, { impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
      }
    }
  }

  /**
   * Assigns user to deterministic variant using Murmur-like hash of userId + experimentId
   */
  public assignVariant(experimentId: string, userId: string): SearchExperimentVariant | null {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.status !== 'ACTIVE' || exp.variants.length === 0) {
      return null;
    }

    // Deterministic hash mod 100
    let hash = 0;
    const key = `${experimentId}:${userId}`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of exp.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }

    return exp.variants[0];
  }

  /**
   * Records impression, click, or conversion events
   */
  public trackEvent(
    experimentId: string,
    variantId: string,
    eventType: 'IMPRESSION' | 'CLICK' | 'CONVERSION',
    revenue: number = 0
  ): void {
    const key = `${experimentId}:${variantId}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, { impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
    }
    const m = this.metrics.get(key)!;

    if (eventType === 'IMPRESSION') m.impressions++;
    else if (eventType === 'CLICK') m.clicks++;
    else if (eventType === 'CONVERSION') {
      m.conversions++;
      m.revenue += revenue;
    }
  }

  /**
   * Computes comparative performance metrics across experiment variants
   */
  public getExperimentResults(experimentId: string): ExperimentMetrics[] {
    const exp = this.experiments.get(experimentId);
    if (!exp) return [];

    const results: ExperimentMetrics[] = [];
    for (const v of exp.variants) {
      const key = `${experimentId}:${v.variantId}`;
      const m = this.metrics.get(key) || { impressions: 0, clicks: 0, conversions: 0, revenue: 0 };

      const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
      const cr = m.clicks > 0 ? (m.conversions / m.clicks) * 100 : 0;
      const aov = m.conversions > 0 ? m.revenue / m.conversions : 0;

      results.push({
        experimentId,
        variantId: v.variantId,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        revenue: Math.round(m.revenue * 100) / 100,
        ctrPercent: Math.round(ctr * 100) / 100,
        conversionRatePercent: Math.round(cr * 100) / 100,
        averageOrderValue: Math.round(aov * 100) / 100,
      });
    }

    return results;
  }
}
