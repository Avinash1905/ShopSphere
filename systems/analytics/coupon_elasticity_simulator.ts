export interface PromoSimulationScenario {
  discountPercent: number; // e.g. 10 for 10%
  projectedVolumeLiftPercent: number;
  projectedUnitSales: number;
  grossRevenue: number;
  totalDiscountCost: number;
  netRevenue: number;
  totalCogs: number;
  grossProfitDollars: number;
  grossMarginPercent: number;
  breakEvenVolumeLiftPercent: number;
  isProfitOptimal: boolean;
}

export interface PromoElasticityReport {
  baselineUnitSales: number;
  baselinePrice: number;
  unitCost: number;
  baselineGrossProfit: number;
  assumedPriceElasticity: number; // e.g. -1.8
  scenarios: PromoSimulationScenario[];
  recommendedDiscountPercent: number;
  maximumProfitDollars: number;
}

export class CouponElasticitySimulator {
  /**
   * Simulates promotional discount tiers and discovers profit-maximizing discount
   */
  public static simulate(
    baselineUnits: number,
    baselinePrice: number,
    unitCost: number,
    elasticityCoefficient: number = -1.8
  ): PromoElasticityReport {
    const baselineCogs = baselineUnits * unitCost;
    const baselineGrossProfit = baselineUnits * baselinePrice - baselineCogs;

    const discountTiers = [0, 5, 10, 15, 20, 25, 30, 40];
    const scenarios: PromoSimulationScenario[] = [];

    let maxProfit = baselineGrossProfit;
    let optimalDiscount = 0;

    for (const disc of discountTiers) {
      const priceReductionPct = disc / 100;
      const discountedPrice = baselinePrice * (1 - priceReductionPct);

      // Volume lift = Elasticity * Price Delta%
      // e.g. -1.8 * (-10%) = +18% volume lift
      const volumeLiftPct = Math.max(0, -elasticityCoefficient * disc);
      const projectedUnits = Math.round(baselineUnits * (1 + volumeLiftPct / 100));

      const grossRev = Math.round(projectedUnits * baselinePrice * 100) / 100;
      const discCost = Math.round(projectedUnits * (baselinePrice * priceReductionPct) * 100) / 100;
      const netRev = Math.round((grossRev - discCost) * 100) / 100;
      const totalCogs = Math.round(projectedUnits * unitCost * 100) / 100;
      const grossProfit = Math.round((netRev - totalCogs) * 100) / 100;
      const marginPct = netRev > 0 ? Math.round((grossProfit / netRev) * 10000) / 100 : 0;

      // Break-even lift = (Discount% / (Margin% - Discount%))
      const baselineMarginFrac = (baselinePrice - unitCost) / baselinePrice;
      const breakEvenLift = priceReductionPct < baselineMarginFrac
        ? Math.round((priceReductionPct / (baselineMarginFrac - priceReductionPct)) * 10000) / 100
        : 999;

      if (grossProfit > maxProfit) {
        maxProfit = grossProfit;
        optimalDiscount = disc;
      }

      scenarios.push({
        discountPercent: disc,
        projectedVolumeLiftPercent: Math.round(volumeLiftPct * 10) / 10,
        projectedUnitSales: projectedUnits,
        grossRevenue: grossRev,
        totalDiscountCost: discCost,
        netRevenue: netRev,
        totalCogs,
        grossProfitDollars: grossProfit,
        grossMarginPercent: marginPct,
        breakEvenVolumeLiftPercent: breakEvenLift,
        isProfitOptimal: false,
      });
    }

    for (const s of scenarios) {
      if (s.discountPercent === optimalDiscount) {
        s.isProfitOptimal = true;
      }
    }

    return {
      baselineUnitSales: baselineUnits,
      baselinePrice,
      unitCost,
      baselineGrossProfit: Math.round(baselineGrossProfit * 100) / 100,
      assumedPriceElasticity: elasticityCoefficient,
      scenarios,
      recommendedDiscountPercent: optimalDiscount,
      maximumProfitDollars: Math.round(maxProfit * 100) / 100,
    };
  }
}
