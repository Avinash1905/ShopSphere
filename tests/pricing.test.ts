import { describe, it, expect } from 'vitest';
import { PricingEngine } from '../systems/pricing/index';

describe('Pricing, Tax & Shipping Calculation Tests', () => {
  const engine = new PricingEngine();

  it('should calculate state sales tax rate accurately', () => {
    const taxRateCA = engine.getTaxRate('US', 'CA');
    expect(taxRateCA).toBe(0.0725);

    const taxRateNY = engine.getTaxRate('US', 'NY');
    expect(taxRateNY).toBe(0.08875);

    const taxRateUK = engine.getTaxRate('GB');
    expect(taxRateUK).toBe(0.20);
  });

  it('should calculate volume discount tiers correctly', () => {
    const unitPrice = 100;
    const discountTier5 = engine.calculateVolumeDiscount(5, unitPrice);
    expect(discountTier5).toBe(5); // 5% of 100

    const discountTier10 = engine.calculateVolumeDiscount(10, unitPrice);
    expect(discountTier10).toBe(10); // 10% of 100

    const discountTier20 = engine.calculateVolumeDiscount(25, unitPrice);
    expect(discountTier20).toBe(15); // 15% of 100
  });

  it('should calculate full cart breakdown with discounts and tax', () => {
    const result = engine.calculateCartTotal([
      {
        productId: 'prod-1',
        sellerId: 'seller-1',
        categoryId: 'cat-1',
        basePrice: 50.00,
        quantity: 2
      }
    ], null, 'US', 'CA');

    expect(result.subtotal).toBe(100.00);
    expect(result.taxableAmount).toBe(100.00);
    expect(result.taxAmount).toBeGreaterThan(0);
    expect(result.grandTotal).toBeGreaterThan(100.00);
    expect(result.currency).toBe('USD');
  });
});
