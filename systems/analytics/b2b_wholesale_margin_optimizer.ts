export interface TierDiscountConfig {
  tierName: string;
  minUnits: number;
  discountPercent: number;
}

export interface WholesaleMarginAnalysis {
  variantSku: string;
  unitCostUsd: number;
  retailPriceUsd: number;
  baselineRetailMarginPercent: number;
  tierEvaluations: Array<{
    tierName: string;
    minUnits: number;
    wholesaleUnitPriceUsd: number;
    unitMarginUsd: number;
    unitMarginPercent: number;
    grossBatchRevenueUsd: number;
    grossBatchProfitUsd: number;
    isProfitable: boolean;
    violatesMinMarginThreshold: boolean;
  }>;
  optimalVolumeRecommendation: {
    recommendedTierName: string;
    rationale: string;
  };
}

export class B2BWholesaleMarginOptimizer {
  /**
   * Analyzes profitability and margin safety across wholesale tiered pricing structures
   */
  public static analyzeMarginSafety(
    sku: string,
    unitCost: number,
    retailPrice: number,
    tiers: TierDiscountConfig[],
    minAllowedMarginPercent: number = 15.0
  ): WholesaleMarginAnalysis {
    const baseMarginUsd = retailPrice - unitCost;
    const baseMarginPercent = retailPrice > 0 ? Math.round((baseMarginUsd / retailPrice) * 10000) / 100 : 0;

    const evaluations = tiers.map(t => {
      const wholesalePrice = Math.round(retailPrice * (1 - t.discountPercent / 100) * 100) / 100;
      const unitMarginUsd = Math.round((wholesalePrice - unitCost) * 100) / 100;
      const unitMarginPercent = wholesalePrice > 0 ? Math.round((unitMarginUsd / wholesalePrice) * 10000) / 100 : 0;
      const batchRevenue = Math.round(wholesalePrice * t.minUnits * 100) / 100;
      const batchProfit = Math.round(unitMarginUsd * t.minUnits * 100) / 100;
      const isProfitable = unitMarginUsd > 0;
      const violates = unitMarginPercent < minAllowedMarginPercent;

      return {
        tierName: t.tierName,
        minUnits: t.minUnits,
        wholesaleUnitPriceUsd: wholesalePrice,
        unitMarginUsd,
        unitMarginPercent,
        grossBatchRevenueUsd: batchRevenue,
        grossBatchProfitUsd: batchProfit,
        isProfitable,
        violatesMinMarginThreshold: violates,
      };
    });

    // Find highest batch profit tier that does not violate threshold
    const validTiers = evaluations.filter(e => !e.violatesMinMarginThreshold && e.isProfitable);
    let topTier = evaluations[0];
    let maxProfit = -Infinity;

    for (const v of validTiers) {
      if (v.grossBatchProfitUsd > maxProfit) {
        maxProfit = v.grossBatchProfitUsd;
        topTier = v;
      }
    }

    return {
      variantSku: sku,
      unitCostUsd: unitCost,
      retailPriceUsd: retailPrice,
      baselineRetailMarginPercent: baseMarginPercent,
      tierEvaluations: evaluations,
      optimalVolumeRecommendation: {
        recommendedTierName: topTier ? topTier.tierName : 'STANDARD_RETAIL',
        rationale: topTier
          ? `Tier '${topTier.tierName}' maximizes batch gross profit ($${topTier.grossBatchProfitUsd.toFixed(2)}) while preserving ${topTier.unitMarginPercent}% margin (> ${minAllowedMarginPercent}% floor).`
          : 'All volume discount tiers fall below minimum required margin safety floor.',
      },
    };
  }
}
