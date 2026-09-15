import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { B2BTieredPricingMatrixTable } from '../schema/b2b_wholesale.schema.js';

export interface TierEvaluationResult {
  variantId: string;
  orderQuantity: number;
  baseRetailUnitPriceUsd: number;
  appliedTierDiscountPercent: number;
  effectiveWholesaleUnitPriceUsd: number;
  totalOrderPriceUsd: number;
  totalSavingsUsd: number;
  nextTierAvailable?: {
    minQuantity: number;
    discountPercent: number;
    additionalUnitsNeeded: number;
    potentialSavingsUsd: number;
  };
}

export class B2BTieredPricingEvaluatorQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Evaluates optimal volume pricing tier based on order quantity
   */
  public async evaluateVolumePricing(
    variantId: string,
    quantity: number,
    baseRetailUnitPriceUsd: number
  ): Promise<TierEvaluationResult> {
    const tiers = await this.db.query<B2BTieredPricingMatrixTable>(
      'SELECT * FROM b2b_tiered_pricing_matrix WHERE variant_id = ? AND is_active = TRUE ORDER BY min_quantity ASC',
      [variantId]
    );

    let matchingTier: B2BTieredPricingMatrixTable | null = null;
    let nextTier: B2BTieredPricingMatrixTable | null = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (quantity >= tier.min_quantity && (!tier.max_quantity || quantity <= tier.max_quantity)) {
        matchingTier = tier;
        if (i + 1 < tiers.length) {
          nextTier = tiers[i + 1];
        }
        break;
      } else if (quantity < tier.min_quantity && !nextTier) {
        nextTier = tier;
      }
    }

    const discountPercent = matchingTier ? matchingTier.discount_percentage : 0;
    const effectiveUnitPrice = matchingTier && matchingTier.fixed_unit_price_usd !== undefined
      ? matchingTier.fixed_unit_price_usd
      : Math.round(baseRetailUnitPriceUsd * (1 - discountPercent / 100) * 100) / 100;

    const totalPrice = Math.round(effectiveUnitPrice * quantity * 100) / 100;
    const undiscountedTotal = Math.round(baseRetailUnitPriceUsd * quantity * 100) / 100;
    const totalSavings = Math.round((undiscountedTotal - totalPrice) * 100) / 100;

    let nextTierInfo: TierEvaluationResult['nextTierAvailable'];
    if (nextTier) {
      const needed = nextTier.min_quantity - quantity;
      const nextUnitPrice = nextTier.fixed_unit_price_usd !== undefined
        ? nextTier.fixed_unit_price_usd
        : Math.round(baseRetailUnitPriceUsd * (1 - nextTier.discount_percentage / 100) * 100) / 100;
      const nextTotal = Math.round(nextUnitPrice * nextTier.min_quantity * 100) / 100;
      const undiscountedNext = Math.round(baseRetailUnitPriceUsd * nextTier.min_quantity * 100) / 100;

      nextTierInfo = {
        minQuantity: nextTier.min_quantity,
        discountPercent: nextTier.discount_percentage,
        additionalUnitsNeeded: needed,
        potentialSavingsUsd: Math.round((undiscountedNext - nextTotal) * 100) / 100,
      };
    }

    return {
      variantId,
      orderQuantity: quantity,
      baseRetailUnitPriceUsd,
      appliedTierDiscountPercent: discountPercent,
      effectiveWholesaleUnitPriceUsd: effectiveUnitPrice,
      totalOrderPriceUsd: totalPrice,
      totalSavingsUsd: totalSavings,
      nextTierAvailable: nextTierInfo,
    };
  }
}
