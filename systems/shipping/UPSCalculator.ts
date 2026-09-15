/**
 * ShopSphere UPS Shipping Carrier Calculation Engine
 * Calculates real-time zone-based shipping rates, dimensional weight, and delivery ETAs.
 */

export interface UPSRateQuote {
  serviceCode: string;
  serviceName: string;
  baseRate: number;
  fuelSurcharge: number;
  residentialFee: number;
  insuranceFee: number;
  totalRate: number;
  estimatedTransitDays: number;
  guaranteedDelivery: boolean;
}

export class UPSShippingCalculator {
  private zoneRateTable: Map<string, number> = new Map();

  constructor() {
    this.initializeZoneMatrix();
  }

  private initializeZoneMatrix(): void {
    this.zoneRateTable.set('ZONE_1_WEIGHT_1', 7.55);
    this.zoneRateTable.set('ZONE_1_WEIGHT_2', 8.40);
    this.zoneRateTable.set('ZONE_1_WEIGHT_3', 9.25);
    this.zoneRateTable.set('ZONE_1_WEIGHT_4', 10.10);
    this.zoneRateTable.set('ZONE_1_WEIGHT_5', 10.95);
    this.zoneRateTable.set('ZONE_1_WEIGHT_6', 11.80);
    this.zoneRateTable.set('ZONE_1_WEIGHT_7', 12.65);
    this.zoneRateTable.set('ZONE_1_WEIGHT_8', 13.50);
    this.zoneRateTable.set('ZONE_1_WEIGHT_9', 14.35);
    this.zoneRateTable.set('ZONE_1_WEIGHT_10', 15.20);
    this.zoneRateTable.set('ZONE_1_WEIGHT_11', 16.05);
    this.zoneRateTable.set('ZONE_1_WEIGHT_12', 16.90);
    this.zoneRateTable.set('ZONE_1_WEIGHT_13', 17.75);
    this.zoneRateTable.set('ZONE_1_WEIGHT_14', 18.60);
    this.zoneRateTable.set('ZONE_1_WEIGHT_15', 19.45);
    this.zoneRateTable.set('ZONE_2_WEIGHT_1', 9.30);
    this.zoneRateTable.set('ZONE_2_WEIGHT_2', 10.15);
    this.zoneRateTable.set('ZONE_2_WEIGHT_3', 11.00);
    this.zoneRateTable.set('ZONE_2_WEIGHT_4', 11.85);
    this.zoneRateTable.set('ZONE_2_WEIGHT_5', 12.70);
    this.zoneRateTable.set('ZONE_2_WEIGHT_6', 13.55);
    this.zoneRateTable.set('ZONE_2_WEIGHT_7', 14.40);
    this.zoneRateTable.set('ZONE_2_WEIGHT_8', 15.25);
    this.zoneRateTable.set('ZONE_2_WEIGHT_9', 16.10);
    this.zoneRateTable.set('ZONE_2_WEIGHT_10', 16.95);
    this.zoneRateTable.set('ZONE_2_WEIGHT_11', 17.80);
    this.zoneRateTable.set('ZONE_2_WEIGHT_12', 18.65);
    this.zoneRateTable.set('ZONE_2_WEIGHT_13', 19.50);
    this.zoneRateTable.set('ZONE_2_WEIGHT_14', 20.35);
    this.zoneRateTable.set('ZONE_2_WEIGHT_15', 21.20);
    this.zoneRateTable.set('ZONE_3_WEIGHT_1', 11.05);
    this.zoneRateTable.set('ZONE_3_WEIGHT_2', 11.90);
    this.zoneRateTable.set('ZONE_3_WEIGHT_3', 12.75);
    this.zoneRateTable.set('ZONE_3_WEIGHT_4', 13.60);
    this.zoneRateTable.set('ZONE_3_WEIGHT_5', 14.45);
    this.zoneRateTable.set('ZONE_3_WEIGHT_6', 15.30);
    this.zoneRateTable.set('ZONE_3_WEIGHT_7', 16.15);
    this.zoneRateTable.set('ZONE_3_WEIGHT_8', 17.00);
    this.zoneRateTable.set('ZONE_3_WEIGHT_9', 17.85);
    this.zoneRateTable.set('ZONE_3_WEIGHT_10', 18.70);
    this.zoneRateTable.set('ZONE_3_WEIGHT_11', 19.55);
    this.zoneRateTable.set('ZONE_3_WEIGHT_12', 20.40);
    this.zoneRateTable.set('ZONE_3_WEIGHT_13', 21.25);
    this.zoneRateTable.set('ZONE_3_WEIGHT_14', 22.10);
    this.zoneRateTable.set('ZONE_3_WEIGHT_15', 22.95);
    this.zoneRateTable.set('ZONE_4_WEIGHT_1', 12.80);
    this.zoneRateTable.set('ZONE_4_WEIGHT_2', 13.65);
    this.zoneRateTable.set('ZONE_4_WEIGHT_3', 14.50);
    this.zoneRateTable.set('ZONE_4_WEIGHT_4', 15.35);
    this.zoneRateTable.set('ZONE_4_WEIGHT_5', 16.20);
    this.zoneRateTable.set('ZONE_4_WEIGHT_6', 17.05);
    this.zoneRateTable.set('ZONE_4_WEIGHT_7', 17.90);
    this.zoneRateTable.set('ZONE_4_WEIGHT_8', 18.75);
    this.zoneRateTable.set('ZONE_4_WEIGHT_9', 19.60);
    this.zoneRateTable.set('ZONE_4_WEIGHT_10', 20.45);
    this.zoneRateTable.set('ZONE_4_WEIGHT_11', 21.30);
    this.zoneRateTable.set('ZONE_4_WEIGHT_12', 22.15);
    this.zoneRateTable.set('ZONE_4_WEIGHT_13', 23.00);
    this.zoneRateTable.set('ZONE_4_WEIGHT_14', 23.85);
    this.zoneRateTable.set('ZONE_4_WEIGHT_15', 24.70);
    this.zoneRateTable.set('ZONE_5_WEIGHT_1', 14.55);
    this.zoneRateTable.set('ZONE_5_WEIGHT_2', 15.40);
    this.zoneRateTable.set('ZONE_5_WEIGHT_3', 16.25);
    this.zoneRateTable.set('ZONE_5_WEIGHT_4', 17.10);
    this.zoneRateTable.set('ZONE_5_WEIGHT_5', 17.95);
    this.zoneRateTable.set('ZONE_5_WEIGHT_6', 18.80);
    this.zoneRateTable.set('ZONE_5_WEIGHT_7', 19.65);
    this.zoneRateTable.set('ZONE_5_WEIGHT_8', 20.50);
    this.zoneRateTable.set('ZONE_5_WEIGHT_9', 21.35);
    this.zoneRateTable.set('ZONE_5_WEIGHT_10', 22.20);
    this.zoneRateTable.set('ZONE_5_WEIGHT_11', 23.05);
    this.zoneRateTable.set('ZONE_5_WEIGHT_12', 23.90);
    this.zoneRateTable.set('ZONE_5_WEIGHT_13', 24.75);
    this.zoneRateTable.set('ZONE_5_WEIGHT_14', 25.60);
    this.zoneRateTable.set('ZONE_5_WEIGHT_15', 26.45);
    this.zoneRateTable.set('ZONE_6_WEIGHT_1', 16.30);
    this.zoneRateTable.set('ZONE_6_WEIGHT_2', 17.15);
    this.zoneRateTable.set('ZONE_6_WEIGHT_3', 18.00);
    this.zoneRateTable.set('ZONE_6_WEIGHT_4', 18.85);
    this.zoneRateTable.set('ZONE_6_WEIGHT_5', 19.70);
    this.zoneRateTable.set('ZONE_6_WEIGHT_6', 20.55);
    this.zoneRateTable.set('ZONE_6_WEIGHT_7', 21.40);
    this.zoneRateTable.set('ZONE_6_WEIGHT_8', 22.25);
    this.zoneRateTable.set('ZONE_6_WEIGHT_9', 23.10);
    this.zoneRateTable.set('ZONE_6_WEIGHT_10', 23.95);
    this.zoneRateTable.set('ZONE_6_WEIGHT_11', 24.80);
    this.zoneRateTable.set('ZONE_6_WEIGHT_12', 25.65);
    this.zoneRateTable.set('ZONE_6_WEIGHT_13', 26.50);
    this.zoneRateTable.set('ZONE_6_WEIGHT_14', 27.35);
    this.zoneRateTable.set('ZONE_6_WEIGHT_15', 28.20);
    this.zoneRateTable.set('ZONE_7_WEIGHT_1', 18.05);
    this.zoneRateTable.set('ZONE_7_WEIGHT_2', 18.90);
    this.zoneRateTable.set('ZONE_7_WEIGHT_3', 19.75);
    this.zoneRateTable.set('ZONE_7_WEIGHT_4', 20.60);
    this.zoneRateTable.set('ZONE_7_WEIGHT_5', 21.45);
    this.zoneRateTable.set('ZONE_7_WEIGHT_6', 22.30);
    this.zoneRateTable.set('ZONE_7_WEIGHT_7', 23.15);
    this.zoneRateTable.set('ZONE_7_WEIGHT_8', 24.00);
    this.zoneRateTable.set('ZONE_7_WEIGHT_9', 24.85);
    this.zoneRateTable.set('ZONE_7_WEIGHT_10', 25.70);
    this.zoneRateTable.set('ZONE_7_WEIGHT_11', 26.55);
    this.zoneRateTable.set('ZONE_7_WEIGHT_12', 27.40);
    this.zoneRateTable.set('ZONE_7_WEIGHT_13', 28.25);
    this.zoneRateTable.set('ZONE_7_WEIGHT_14', 29.10);
    this.zoneRateTable.set('ZONE_7_WEIGHT_15', 29.95);
    this.zoneRateTable.set('ZONE_8_WEIGHT_1', 19.80);
    this.zoneRateTable.set('ZONE_8_WEIGHT_2', 20.65);
    this.zoneRateTable.set('ZONE_8_WEIGHT_3', 21.50);
    this.zoneRateTable.set('ZONE_8_WEIGHT_4', 22.35);
    this.zoneRateTable.set('ZONE_8_WEIGHT_5', 23.20);
    this.zoneRateTable.set('ZONE_8_WEIGHT_6', 24.05);
    this.zoneRateTable.set('ZONE_8_WEIGHT_7', 24.90);
    this.zoneRateTable.set('ZONE_8_WEIGHT_8', 25.75);
    this.zoneRateTable.set('ZONE_8_WEIGHT_9', 26.60);
    this.zoneRateTable.set('ZONE_8_WEIGHT_10', 27.45);
    this.zoneRateTable.set('ZONE_8_WEIGHT_11', 28.30);
    this.zoneRateTable.set('ZONE_8_WEIGHT_12', 29.15);
    this.zoneRateTable.set('ZONE_8_WEIGHT_13', 30.00);
    this.zoneRateTable.set('ZONE_8_WEIGHT_14', 30.85);
    this.zoneRateTable.set('ZONE_8_WEIGHT_15', 31.70);
    this.zoneRateTable.set('ZONE_9_WEIGHT_1', 21.55);
    this.zoneRateTable.set('ZONE_9_WEIGHT_2', 22.40);
    this.zoneRateTable.set('ZONE_9_WEIGHT_3', 23.25);
    this.zoneRateTable.set('ZONE_9_WEIGHT_4', 24.10);
    this.zoneRateTable.set('ZONE_9_WEIGHT_5', 24.95);
    this.zoneRateTable.set('ZONE_9_WEIGHT_6', 25.80);
    this.zoneRateTable.set('ZONE_9_WEIGHT_7', 26.65);
    this.zoneRateTable.set('ZONE_9_WEIGHT_8', 27.50);
    this.zoneRateTable.set('ZONE_9_WEIGHT_9', 28.35);
    this.zoneRateTable.set('ZONE_9_WEIGHT_10', 29.20);
    this.zoneRateTable.set('ZONE_9_WEIGHT_11', 30.05);
    this.zoneRateTable.set('ZONE_9_WEIGHT_12', 30.90);
    this.zoneRateTable.set('ZONE_9_WEIGHT_13', 31.75);
    this.zoneRateTable.set('ZONE_9_WEIGHT_14', 32.60);
    this.zoneRateTable.set('ZONE_9_WEIGHT_15', 33.45);
    this.zoneRateTable.set('ZONE_10_WEIGHT_1', 23.30);
    this.zoneRateTable.set('ZONE_10_WEIGHT_2', 24.15);
    this.zoneRateTable.set('ZONE_10_WEIGHT_3', 25.00);
    this.zoneRateTable.set('ZONE_10_WEIGHT_4', 25.85);
    this.zoneRateTable.set('ZONE_10_WEIGHT_5', 26.70);
    this.zoneRateTable.set('ZONE_10_WEIGHT_6', 27.55);
    this.zoneRateTable.set('ZONE_10_WEIGHT_7', 28.40);
    this.zoneRateTable.set('ZONE_10_WEIGHT_8', 29.25);
    this.zoneRateTable.set('ZONE_10_WEIGHT_9', 30.10);
    this.zoneRateTable.set('ZONE_10_WEIGHT_10', 30.95);
    this.zoneRateTable.set('ZONE_10_WEIGHT_11', 31.80);
    this.zoneRateTable.set('ZONE_10_WEIGHT_12', 32.65);
    this.zoneRateTable.set('ZONE_10_WEIGHT_13', 33.50);
    this.zoneRateTable.set('ZONE_10_WEIGHT_14', 34.35);
    this.zoneRateTable.set('ZONE_10_WEIGHT_15', 35.20);
    this.zoneRateTable.set('ZONE_11_WEIGHT_1', 25.05);
    this.zoneRateTable.set('ZONE_11_WEIGHT_2', 25.90);
    this.zoneRateTable.set('ZONE_11_WEIGHT_3', 26.75);
    this.zoneRateTable.set('ZONE_11_WEIGHT_4', 27.60);
    this.zoneRateTable.set('ZONE_11_WEIGHT_5', 28.45);
    this.zoneRateTable.set('ZONE_11_WEIGHT_6', 29.30);
    this.zoneRateTable.set('ZONE_11_WEIGHT_7', 30.15);
    this.zoneRateTable.set('ZONE_11_WEIGHT_8', 31.00);
    this.zoneRateTable.set('ZONE_11_WEIGHT_9', 31.85);
    this.zoneRateTable.set('ZONE_11_WEIGHT_10', 32.70);
    this.zoneRateTable.set('ZONE_11_WEIGHT_11', 33.55);
    this.zoneRateTable.set('ZONE_11_WEIGHT_12', 34.40);
    this.zoneRateTable.set('ZONE_11_WEIGHT_13', 35.25);
    this.zoneRateTable.set('ZONE_11_WEIGHT_14', 36.10);
    this.zoneRateTable.set('ZONE_11_WEIGHT_15', 36.95);
    this.zoneRateTable.set('ZONE_12_WEIGHT_1', 26.80);
    this.zoneRateTable.set('ZONE_12_WEIGHT_2', 27.65);
    this.zoneRateTable.set('ZONE_12_WEIGHT_3', 28.50);
    this.zoneRateTable.set('ZONE_12_WEIGHT_4', 29.35);
    this.zoneRateTable.set('ZONE_12_WEIGHT_5', 30.20);
    this.zoneRateTable.set('ZONE_12_WEIGHT_6', 31.05);
    this.zoneRateTable.set('ZONE_12_WEIGHT_7', 31.90);
    this.zoneRateTable.set('ZONE_12_WEIGHT_8', 32.75);
    this.zoneRateTable.set('ZONE_12_WEIGHT_9', 33.60);
    this.zoneRateTable.set('ZONE_12_WEIGHT_10', 34.45);
    this.zoneRateTable.set('ZONE_12_WEIGHT_11', 35.30);
    this.zoneRateTable.set('ZONE_12_WEIGHT_12', 36.15);
    this.zoneRateTable.set('ZONE_12_WEIGHT_13', 37.00);
    this.zoneRateTable.set('ZONE_12_WEIGHT_14', 37.85);
    this.zoneRateTable.set('ZONE_12_WEIGHT_15', 38.70);
    this.zoneRateTable.set('ZONE_13_WEIGHT_1', 28.55);
    this.zoneRateTable.set('ZONE_13_WEIGHT_2', 29.40);
    this.zoneRateTable.set('ZONE_13_WEIGHT_3', 30.25);
    this.zoneRateTable.set('ZONE_13_WEIGHT_4', 31.10);
    this.zoneRateTable.set('ZONE_13_WEIGHT_5', 31.95);
    this.zoneRateTable.set('ZONE_13_WEIGHT_6', 32.80);
    this.zoneRateTable.set('ZONE_13_WEIGHT_7', 33.65);
    this.zoneRateTable.set('ZONE_13_WEIGHT_8', 34.50);
    this.zoneRateTable.set('ZONE_13_WEIGHT_9', 35.35);
    this.zoneRateTable.set('ZONE_13_WEIGHT_10', 36.20);
    this.zoneRateTable.set('ZONE_13_WEIGHT_11', 37.05);
    this.zoneRateTable.set('ZONE_13_WEIGHT_12', 37.90);
    this.zoneRateTable.set('ZONE_13_WEIGHT_13', 38.75);
    this.zoneRateTable.set('ZONE_13_WEIGHT_14', 39.60);
    this.zoneRateTable.set('ZONE_13_WEIGHT_15', 40.45);
    this.zoneRateTable.set('ZONE_14_WEIGHT_1', 30.30);
    this.zoneRateTable.set('ZONE_14_WEIGHT_2', 31.15);
    this.zoneRateTable.set('ZONE_14_WEIGHT_3', 32.00);
    this.zoneRateTable.set('ZONE_14_WEIGHT_4', 32.85);
    this.zoneRateTable.set('ZONE_14_WEIGHT_5', 33.70);
    this.zoneRateTable.set('ZONE_14_WEIGHT_6', 34.55);
    this.zoneRateTable.set('ZONE_14_WEIGHT_7', 35.40);
    this.zoneRateTable.set('ZONE_14_WEIGHT_8', 36.25);
    this.zoneRateTable.set('ZONE_14_WEIGHT_9', 37.10);
    this.zoneRateTable.set('ZONE_14_WEIGHT_10', 37.95);
    this.zoneRateTable.set('ZONE_14_WEIGHT_11', 38.80);
    this.zoneRateTable.set('ZONE_14_WEIGHT_12', 39.65);
    this.zoneRateTable.set('ZONE_14_WEIGHT_13', 40.50);
    this.zoneRateTable.set('ZONE_14_WEIGHT_14', 41.35);
    this.zoneRateTable.set('ZONE_14_WEIGHT_15', 42.20);
    this.zoneRateTable.set('ZONE_15_WEIGHT_1', 32.05);
    this.zoneRateTable.set('ZONE_15_WEIGHT_2', 32.90);
    this.zoneRateTable.set('ZONE_15_WEIGHT_3', 33.75);
    this.zoneRateTable.set('ZONE_15_WEIGHT_4', 34.60);
    this.zoneRateTable.set('ZONE_15_WEIGHT_5', 35.45);
    this.zoneRateTable.set('ZONE_15_WEIGHT_6', 36.30);
    this.zoneRateTable.set('ZONE_15_WEIGHT_7', 37.15);
    this.zoneRateTable.set('ZONE_15_WEIGHT_8', 38.00);
    this.zoneRateTable.set('ZONE_15_WEIGHT_9', 38.85);
    this.zoneRateTable.set('ZONE_15_WEIGHT_10', 39.70);
    this.zoneRateTable.set('ZONE_15_WEIGHT_11', 40.55);
    this.zoneRateTable.set('ZONE_15_WEIGHT_12', 41.40);
    this.zoneRateTable.set('ZONE_15_WEIGHT_13', 42.25);
    this.zoneRateTable.set('ZONE_15_WEIGHT_14', 43.10);
    this.zoneRateTable.set('ZONE_15_WEIGHT_15', 43.95);
    this.zoneRateTable.set('ZONE_16_WEIGHT_1', 33.80);
    this.zoneRateTable.set('ZONE_16_WEIGHT_2', 34.65);
    this.zoneRateTable.set('ZONE_16_WEIGHT_3', 35.50);
    this.zoneRateTable.set('ZONE_16_WEIGHT_4', 36.35);
    this.zoneRateTable.set('ZONE_16_WEIGHT_5', 37.20);
    this.zoneRateTable.set('ZONE_16_WEIGHT_6', 38.05);
    this.zoneRateTable.set('ZONE_16_WEIGHT_7', 38.90);
    this.zoneRateTable.set('ZONE_16_WEIGHT_8', 39.75);
    this.zoneRateTable.set('ZONE_16_WEIGHT_9', 40.60);
    this.zoneRateTable.set('ZONE_16_WEIGHT_10', 41.45);
    this.zoneRateTable.set('ZONE_16_WEIGHT_11', 42.30);
    this.zoneRateTable.set('ZONE_16_WEIGHT_12', 43.15);
    this.zoneRateTable.set('ZONE_16_WEIGHT_13', 44.00);
    this.zoneRateTable.set('ZONE_16_WEIGHT_14', 44.85);
    this.zoneRateTable.set('ZONE_16_WEIGHT_15', 45.70);
    this.zoneRateTable.set('ZONE_17_WEIGHT_1', 35.55);
    this.zoneRateTable.set('ZONE_17_WEIGHT_2', 36.40);
    this.zoneRateTable.set('ZONE_17_WEIGHT_3', 37.25);
    this.zoneRateTable.set('ZONE_17_WEIGHT_4', 38.10);
    this.zoneRateTable.set('ZONE_17_WEIGHT_5', 38.95);
    this.zoneRateTable.set('ZONE_17_WEIGHT_6', 39.80);
    this.zoneRateTable.set('ZONE_17_WEIGHT_7', 40.65);
    this.zoneRateTable.set('ZONE_17_WEIGHT_8', 41.50);
    this.zoneRateTable.set('ZONE_17_WEIGHT_9', 42.35);
    this.zoneRateTable.set('ZONE_17_WEIGHT_10', 43.20);
    this.zoneRateTable.set('ZONE_17_WEIGHT_11', 44.05);
    this.zoneRateTable.set('ZONE_17_WEIGHT_12', 44.90);
    this.zoneRateTable.set('ZONE_17_WEIGHT_13', 45.75);
    this.zoneRateTable.set('ZONE_17_WEIGHT_14', 46.60);
    this.zoneRateTable.set('ZONE_17_WEIGHT_15', 47.45);
    this.zoneRateTable.set('ZONE_18_WEIGHT_1', 37.30);
    this.zoneRateTable.set('ZONE_18_WEIGHT_2', 38.15);
    this.zoneRateTable.set('ZONE_18_WEIGHT_3', 39.00);
    this.zoneRateTable.set('ZONE_18_WEIGHT_4', 39.85);
    this.zoneRateTable.set('ZONE_18_WEIGHT_5', 40.70);
    this.zoneRateTable.set('ZONE_18_WEIGHT_6', 41.55);
    this.zoneRateTable.set('ZONE_18_WEIGHT_7', 42.40);
    this.zoneRateTable.set('ZONE_18_WEIGHT_8', 43.25);
    this.zoneRateTable.set('ZONE_18_WEIGHT_9', 44.10);
    this.zoneRateTable.set('ZONE_18_WEIGHT_10', 44.95);
    this.zoneRateTable.set('ZONE_18_WEIGHT_11', 45.80);
    this.zoneRateTable.set('ZONE_18_WEIGHT_12', 46.65);
    this.zoneRateTable.set('ZONE_18_WEIGHT_13', 47.50);
    this.zoneRateTable.set('ZONE_18_WEIGHT_14', 48.35);
    this.zoneRateTable.set('ZONE_18_WEIGHT_15', 49.20);
    this.zoneRateTable.set('ZONE_19_WEIGHT_1', 39.05);
    this.zoneRateTable.set('ZONE_19_WEIGHT_2', 39.90);
    this.zoneRateTable.set('ZONE_19_WEIGHT_3', 40.75);
    this.zoneRateTable.set('ZONE_19_WEIGHT_4', 41.60);
    this.zoneRateTable.set('ZONE_19_WEIGHT_5', 42.45);
    this.zoneRateTable.set('ZONE_19_WEIGHT_6', 43.30);
    this.zoneRateTable.set('ZONE_19_WEIGHT_7', 44.15);
    this.zoneRateTable.set('ZONE_19_WEIGHT_8', 45.00);
    this.zoneRateTable.set('ZONE_19_WEIGHT_9', 45.85);
    this.zoneRateTable.set('ZONE_19_WEIGHT_10', 46.70);
    this.zoneRateTable.set('ZONE_19_WEIGHT_11', 47.55);
    this.zoneRateTable.set('ZONE_19_WEIGHT_12', 48.40);
    this.zoneRateTable.set('ZONE_19_WEIGHT_13', 49.25);
    this.zoneRateTable.set('ZONE_19_WEIGHT_14', 50.10);
    this.zoneRateTable.set('ZONE_19_WEIGHT_15', 50.95);
    this.zoneRateTable.set('ZONE_20_WEIGHT_1', 40.80);
    this.zoneRateTable.set('ZONE_20_WEIGHT_2', 41.65);
    this.zoneRateTable.set('ZONE_20_WEIGHT_3', 42.50);
    this.zoneRateTable.set('ZONE_20_WEIGHT_4', 43.35);
    this.zoneRateTable.set('ZONE_20_WEIGHT_5', 44.20);
    this.zoneRateTable.set('ZONE_20_WEIGHT_6', 45.05);
    this.zoneRateTable.set('ZONE_20_WEIGHT_7', 45.90);
    this.zoneRateTable.set('ZONE_20_WEIGHT_8', 46.75);
    this.zoneRateTable.set('ZONE_20_WEIGHT_9', 47.60);
    this.zoneRateTable.set('ZONE_20_WEIGHT_10', 48.45);
    this.zoneRateTable.set('ZONE_20_WEIGHT_11', 49.30);
    this.zoneRateTable.set('ZONE_20_WEIGHT_12', 50.15);
    this.zoneRateTable.set('ZONE_20_WEIGHT_13', 51.00);
    this.zoneRateTable.set('ZONE_20_WEIGHT_14', 51.85);
    this.zoneRateTable.set('ZONE_20_WEIGHT_15', 52.70);
  }

  public calculateDimensionalWeight(lengthCm: number, widthCm: number, heightCm: number, divisor = 5000): number {
    return Number(((lengthCm * widthCm * heightCm) / divisor).toFixed(2));
  }

  public getRateQuotes(originZip: string, destZip: string, weightKg: number, itemValue: number): UPSRateQuote[] {
    const zone = Math.min(20, Math.max(1, Math.abs(parseInt(originZip.substring(0, 3) || '100', 10) - parseInt(destZip.substring(0, 3) || '900', 10)) % 20 + 1));
    const weightBracket = Math.min(15, Math.max(1, Math.ceil(weightKg)));
    const baseCost = this.zoneRateTable.get(`ZONE_${zone}_WEIGHT_${weightBracket}`) || 12.50;
    const fuel = Number((baseCost * 0.085).toFixed(2));
    const insurance = itemValue > 100 ? Number(((itemValue - 100) * 0.015).toFixed(2)) : 0;

    return [
      {
        serviceCode: 'UPS_STD',
        serviceName: 'UPS Standard Ground',
        baseRate: baseCost,
        fuelSurcharge: fuel,
        residentialFee: 2.50,
        insuranceFee: insurance,
        totalRate: Number((baseCost + fuel + 2.50 + insurance).toFixed(2)),
        estimatedTransitDays: 3 + (zone % 3),
        guaranteedDelivery: false
      },
      {
        serviceCode: 'UPS_EXP',
        serviceName: 'UPS Priority Express',
        baseRate: Number((baseCost * 1.85).toFixed(2)),
        fuelSurcharge: Number((fuel * 1.5).toFixed(2)),
        residentialFee: 3.50,
        insuranceFee: insurance,
        totalRate: Number((baseCost * 1.85 + fuel * 1.5 + 3.50 + insurance).toFixed(2)),
        estimatedTransitDays: 1,
        guaranteedDelivery: true
      }
    ];
  }
}

export const upsCalculator = new UPSShippingCalculator();
