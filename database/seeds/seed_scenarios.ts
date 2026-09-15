/**
 * ShopSphere Database Layer - E-Commerce Simulation Scenario Generators
 * Scenarios:
 * 1. Black Friday Flash Sale (Extreme high contention on single variant inventory)
 * 2. Multi-Seller Marketplace Payouts (High volume revenue splits & commissions)
 * 3. Chargeback / Refund Wave (Order status transitions & inventory returns)
 */

import { FakerPRNGUtils } from './faker_prng_utils.js';
import * as crypto from 'crypto';

export interface FlashSaleScenarioData {
  hotProduct: { id: string; title: string; variantId: string; initialStock: number };
  buyers: Array<{ id: string; email: string }>;
  orders: Array<{ id: string; userId: string; variantId: string; quantity: number }>;
}

export class SeedScenarioGenerator {
  public static generateFlashSaleScenario(buyersCount: number = 100, stockUnits: number = 20): FlashSaleScenarioData {
    const faker = new FakerPRNGUtils(42);
    const productId = crypto.randomUUID();
    const variantId = crypto.randomUUID();

    const hotProduct = {
      id: productId,
      title: 'Limited Edition Next-Gen Noise-Cancelling Headphones',
      variantId,
      initialStock: stockUnits,
    };

    const buyers: FlashSaleScenarioData['buyers'] = [];
    for (let i = 0; i < buyersCount; i++) {
      const first = faker.nextChoice(['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey']);
      const last = faker.nextChoice(['Smith', 'Johnson', 'Lee', 'Williams', 'Brown']);
      buyers.push({
        id: crypto.randomUUID(),
        email: faker.nextEmail(first, last),
      });
    }

    const orders: FlashSaleScenarioData['orders'] = [];
    for (const buyer of buyers) {
      orders.push({
        id: crypto.randomUUID(),
        userId: buyer.id,
        variantId,
        quantity: 1,
      });
    }

    return {
      hotProduct,
      buyers,
      orders,
    };
  }
}
