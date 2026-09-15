export interface PackageDimensions {
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  actualWeightLbs: number;
}

export interface CarrierRateQuote {
  carrierCode: 'FEDEX' | 'UPS' | 'DHL' | 'USPS';
  serviceLevel: string; // e.g. 'OVERNIGHT', 'GROUND', 'EXPRESS_2DAY'
  billableWeightLbs: number;
  baseRate: number;
  fuelSurcharge: number;
  totalShippingRate: number;
  estimatedTransitDays: number;
  guaranteedDeliveryDate: string;
}

export class CarrierShippingRateEngine {
  /**
   * Calculates dimensional billable weight (DIM divisor = 139 standard for commercial carriers)
   */
  public static calculateBillableWeight(dim: PackageDimensions, dimDivisor: number = 139): number {
    const dimWeight = (dim.lengthInches * dim.widthInches * dim.heightInches) / dimDivisor;
    const billable = Math.max(dim.actualWeightLbs, dimWeight);
    return Math.ceil(billable * 10) / 10;
  }

  /**
   * Rates and shops across multiple logistics carriers
   */
  public static rateShop(
    dimensions: PackageDimensions,
    originPostal: string,
    destPostal: string
  ): CarrierRateQuote[] {
    const billableWeight = CarrierShippingRateEngine.calculateBillableWeight(dimensions);
    const isInterstate = originPostal.substring(0, 2) !== destPostal.substring(0, 2);
    const zoneMultiplier = isInterstate ? 1.4 : 1.0;

    const quotes: CarrierRateQuote[] = [
      {
        carrierCode: 'USPS',
        serviceLevel: 'PRIORITY_MAIL',
        billableWeightLbs: billableWeight,
        baseRate: Math.round((7.5 + billableWeight * 1.25 * zoneMultiplier) * 100) / 100,
        fuelSurcharge: 0.85,
        totalShippingRate: Math.round((7.5 + billableWeight * 1.25 * zoneMultiplier + 0.85) * 100) / 100,
        estimatedTransitDays: 3,
        guaranteedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10),
      },
      {
        carrierCode: 'UPS',
        serviceLevel: 'UPS_GROUND',
        billableWeightLbs: billableWeight,
        baseRate: Math.round((9.0 + billableWeight * 1.15 * zoneMultiplier) * 100) / 100,
        fuelSurcharge: 1.2,
        totalShippingRate: Math.round((9.0 + billableWeight * 1.15 * zoneMultiplier + 1.2) * 100) / 100,
        estimatedTransitDays: 2,
        guaranteedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().substring(0, 10),
      },
      {
        carrierCode: 'FEDEX',
        serviceLevel: 'FEDEX_EXPRESS_2DAY',
        billableWeightLbs: billableWeight,
        baseRate: Math.round((14.0 + billableWeight * 2.1 * zoneMultiplier) * 100) / 100,
        fuelSurcharge: 1.8,
        totalShippingRate: Math.round((14.0 + billableWeight * 2.1 * zoneMultiplier + 1.8) * 100) / 100,
        estimatedTransitDays: 2,
        guaranteedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().substring(0, 10),
      },
      {
        carrierCode: 'DHL',
        serviceLevel: 'DHL_EXPRESS_OVERNIGHT',
        billableWeightLbs: billableWeight,
        baseRate: Math.round((28.0 + billableWeight * 3.5 * zoneMultiplier) * 100) / 100,
        fuelSurcharge: 2.5,
        totalShippingRate: Math.round((28.0 + billableWeight * 3.5 * zoneMultiplier + 2.5) * 100) / 100,
        estimatedTransitDays: 1,
        guaranteedDeliveryDate: new Date(Date.now() + 1 * 86400000).toISOString().substring(0, 10),
      },
    ];

    quotes.sort((a, b) => a.totalShippingRate - b.totalShippingRate);
    return quotes;
  }
}
