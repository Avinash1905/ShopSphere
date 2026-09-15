import { describe, it, expect } from 'vitest';
import { mockCartService } from '../services/mock/mockCartService';
import { CartItem } from '../types';
import { MOCK_PRODUCTS } from '../constants/products';

describe('E-Commerce Pricing & Calculation Engine', () => {
  const prod1 = MOCK_PRODUCTS[0]; // Price: 1199
  const prod2 = MOCK_PRODUCTS[1]; // Price: 348

  const sampleItems: CartItem[] = [
    {
      id: 'item-1',
      productId: prod1.id,
      quantity: 2,
      unitPrice: prod1.price,
      totalPrice: prod1.price * 2,
      isAvailable: true,
      maxAvailableQuantity: 10,
      addedAt: new Date().toISOString(),
      product: prod1,
    },
    {
      id: 'item-2',
      productId: prod2.id,
      quantity: 1,
      unitPrice: prod2.price,
      totalPrice: prod2.price * 1,
      isAvailable: true,
      maxAvailableQuantity: 5,
      addedAt: new Date().toISOString(),
      product: prod2,
    },
  ];

  it('calculates subtotal and total quantities accurately', () => {
    const summary = mockCartService.calculateSummary(sampleItems);
    const expectedSubtotal = prod1.price * 2 + prod2.price * 1;

    expect(summary.itemsCount).toBe(2);
    expect(summary.totalQuantity).toBe(3);
    expect(summary.subtotal).toBe(expectedSubtotal);
  });

  it('applies free shipping when order value exceeds the free shipping threshold ($75)', () => {
    const summary = mockCartService.calculateSummary(sampleItems);
    expect(summary.subtotal).toBeGreaterThan(75);
    expect(summary.estimatedShipping).toBe(0);
    expect(summary.amountNeededForFreeShipping).toBe(0);
  });

  it('charges standard shipping for low value subtotal (< $75)', () => {
    const lowValueItem: CartItem[] = [
      {
        id: 'item-low',
        productId: 'prod-low',
        quantity: 1,
        unitPrice: 25.0,
        totalPrice: 25.0,
        isAvailable: true,
        maxAvailableQuantity: 5,
        addedAt: new Date().toISOString(),
        product: {
          ...prod1,
          id: 'prod-low',
          price: 25.0,
        },
      },
    ];

    const summary = mockCartService.calculateSummary(lowValueItem);
    expect(summary.subtotal).toBe(25.0);
    expect(summary.estimatedShipping).toBe(5.99);
    expect(summary.amountNeededForFreeShipping).toBe(50.0);
  });

  it('computes sales tax at 8.5% rate on the discounted taxable amount', () => {
    const summary = mockCartService.calculateSummary(sampleItems);
    const taxable = summary.subtotal - summary.discountAmount;
    const expectedTax = Number((taxable * 0.085).toFixed(2));
    expect(summary.taxAmount).toBe(expectedTax);
  });

  it('computes grand total as taxable subtotal + tax + shipping fee', () => {
    const summary = mockCartService.calculateSummary(sampleItems);
    const expectedTotal = Number(
      (summary.subtotal - summary.discountAmount + summary.taxAmount + summary.estimatedShipping).toFixed(2)
    );
    expect(summary.grandTotal).toBe(expectedTotal);
  });
});
