export interface HSTariffRule {
  hsCode: string;
  category: string;
  dutyRatePercent: number; // e.g. 4.5%
  vatStandardPercent: number; // e.g. 20%
}

export interface LandedCostBreakdown {
  productPrice: number;
  shippingCharge: number;
  insuranceCharge: number;
  hsCode: string;
  dutyAmount: number;
  vatGstAmount: number;
  customsProcessingFee: number;
  totalLandedCost: number;
  effectiveTaxDutyRatePercent: number;
}

export class CustomsHarmonizedTariffEngine {
  private static readonly HS_DATABASE: Record<string, HSTariffRule> = {
    '8471.30': { hsCode: '8471.30', category: 'Laptops & Portable Computers', dutyRatePercent: 0.0, vatStandardPercent: 19.0 },
    '8517.13': { hsCode: '8517.13', category: 'Smartphones', dutyRatePercent: 0.0, vatStandardPercent: 19.0 },
    '8518.30': { hsCode: '8518.30', category: 'Headphones & Audio', dutyRatePercent: 2.0, vatStandardPercent: 19.0 },
    '6404.11': { hsCode: '6404.11', category: 'Athletic Footwear', dutyRatePercent: 8.5, vatStandardPercent: 20.0 },
    '8509.40': { hsCode: '8509.40', category: 'Kitchen Appliances', dutyRatePercent: 3.2, vatStandardPercent: 20.0 },
  };

  /**
   * Calculates comprehensive cross-border landed cost for international checkout
   */
  public static calculateLandedCost(
    productPrice: number,
    shippingCharge: number,
    hsCode: string = '8471.30',
    destinationCountry: string = 'DE'
  ): LandedCostBreakdown {
    const rule = CustomsHarmonizedTariffEngine.HS_DATABASE[hsCode] || {
      hsCode,
      category: 'General Goods',
      dutyRatePercent: 5.0,
      vatStandardPercent: 20.0,
    };

    const insurance = Math.round(productPrice * 0.015 * 100) / 100; // 1.5% insurance
    const customsValuationBase = productPrice + shippingCharge + insurance; // CIF (Cost, Insurance, Freight)

    const duty = Math.round((customsValuationBase * (rule.dutyRatePercent / 100)) * 100) / 100;
    const vatBase = customsValuationBase + duty;
    const vat = Math.round((vatBase * (rule.vatStandardPercent / 100)) * 100) / 100;
    const clearanceFee = 12.50; // Standard carrier customs clearance brokerage

    const totalLanded = Math.round((productPrice + shippingCharge + insurance + duty + vat + clearanceFee) * 100) / 100;
    const effectiveRate = productPrice > 0 ? Math.round(((duty + vat) / productPrice) * 10000) / 100 : 0;

    return {
      productPrice,
      shippingCharge,
      insuranceCharge: insurance,
      hsCode,
      dutyAmount: duty,
      vatGstAmount: vat,
      customsProcessingFee: clearanceFee,
      totalLandedCost: totalLanded,
      effectiveTaxDutyRatePercent: effectiveRate,
    };
  }
}
