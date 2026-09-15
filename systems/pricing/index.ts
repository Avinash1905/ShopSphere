/**
 * ShopSphere Pricing & Taxation Subsystem
 * Multi-tier volume discounts, regional tax engine (US State tax, VAT, GST),
 * coupon validation rules, seller discount matrix, and shipping fee calculation.
 */

import { CouponEntity } from '../../packages/shared-types';

export interface PricingItem {
  productId: string;
  variantId?: string;
  sellerId: string;
  categoryId: string;
  basePrice: number;
  quantity: number;
  selectedDiscountPct?: number;
}

export interface TaxJurisdiction {
  country: string;
  stateOrProvince?: string;
  postalCodePrefix?: string;
  standardRate: number;
  reducedRate?: number;
  exemptCategories?: string[];
}

export interface CartCalculationResult {
  subtotal: number;
  volumeDiscountAmount: number;
  couponDiscountAmount: number;
  totalDiscountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  currency: string;
  breakdown: {
    productId: string;
    unitPrice: number;
    quantity: number;
    grossTotal: number;
    discount: number;
    netTotal: number;
    taxRate: number;
    tax: number;
  }[];
}

export class PricingEngine {
  private taxJurisdictions: Map<string, TaxJurisdiction> = new Map();

  constructor() {
    this.seedTaxJurisdictions();
  }

  private seedTaxJurisdictions(): void {
    // US State Rates
    this.taxJurisdictions.set('US-CA', { country: 'US', stateOrProvince: 'CA', standardRate: 0.0725 });
    this.taxJurisdictions.set('US-NY', { country: 'US', stateOrProvince: 'NY', standardRate: 0.08875 });
    this.taxJurisdictions.set('US-TX', { country: 'US', stateOrProvince: 'TX', standardRate: 0.0625 });
    this.taxJurisdictions.set('US-FL', { country: 'US', stateOrProvince: 'FL', standardRate: 0.06 });
    this.taxJurisdictions.set('US-DEFAULT', { country: 'US', standardRate: 0.05 });

    // International Rates
    this.taxJurisdictions.set('GB', { country: 'GB', standardRate: 0.20 }); // UK VAT
    this.taxJurisdictions.set('DE', { country: 'DE', standardRate: 0.19 }); // German VAT
    this.taxJurisdictions.set('IN', { country: 'IN', standardRate: 0.18 }); // India GST
    this.taxJurisdictions.set('DEFAULT', { country: 'GLOBAL', standardRate: 0.08 });
  }

  public getTaxRate(country = 'US', stateOrProvince?: string): number {
    if (country === 'US' && stateOrProvince) {
      const stateKey = `US-${stateOrProvince.toUpperCase()}`;
      if (this.taxJurisdictions.has(stateKey)) {
        return this.taxJurisdictions.get(stateKey)!.standardRate;
      }
      return this.taxJurisdictions.get('US-DEFAULT')!.standardRate;
    }
    if (this.taxJurisdictions.has(country.toUpperCase())) {
      return this.taxJurisdictions.get(country.toUpperCase())!.standardRate;
    }
    return this.taxJurisdictions.get('DEFAULT')!.standardRate;
  }

  public calculateVolumeDiscount(quantity: number, unitPrice: number): number {
    if (quantity >= 20) return unitPrice * 0.15; // 15% bulk discount
    if (quantity >= 10) return unitPrice * 0.10; // 10% volume discount
    if (quantity >= 5) return unitPrice * 0.05;  // 5% tiered discount
    return 0;
  }

  public evaluateCoupon(coupon: CouponEntity | null, subtotal: number, items: PricingItem[]): number {
    if (!coupon || !coupon.isActive) return 0;

    const now = new Date();
    if (new Date(coupon.startDate) > now || new Date(coupon.endDate) < now) {
      return 0;
    }

    if (subtotal < coupon.minOrderAmount) {
      return 0;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return 0;
    }

    let applicableSubtotal = subtotal;
    if (coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0) {
      applicableSubtotal = items
        .filter(i => coupon.applicableCategoryIds!.includes(i.categoryId))
        .reduce((sum, i) => sum + i.basePrice * i.quantity, 0);
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (applicableSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = Math.min(coupon.discountValue, applicableSubtotal);
    }

    return Number(discount.toFixed(2));
  }

  public calculateCartTotal(
    items: PricingItem[],
    coupon: CouponEntity | null = null,
    country = 'US',
    state?: string,
    currency = 'USD'
  ): CartCalculationResult {
    let rawSubtotal = 0;
    let totalVolumeDiscount = 0;

    const breakdown = items.map(item => {
      const grossTotal = item.basePrice * item.quantity;
      rawSubtotal += grossTotal;

      const unitVolDisc = this.calculateVolumeDiscount(item.quantity, item.basePrice);
      const volDiscount = unitVolDisc * item.quantity;
      totalVolumeDiscount += volDiscount;

      const netTotal = grossTotal - volDiscount;
      const taxRate = this.getTaxRate(country, state);
      const tax = Number((netTotal * taxRate).toFixed(2));

      return {
        productId: item.productId,
        unitPrice: item.basePrice,
        quantity: item.quantity,
        grossTotal: Number(grossTotal.toFixed(2)),
        discount: Number(volDiscount.toFixed(2)),
        netTotal: Number(netTotal.toFixed(2)),
        taxRate,
        tax
      };
    });

    const subtotal = Number(rawSubtotal.toFixed(2));
    const volumeDiscountAmount = Number(totalVolumeDiscount.toFixed(2));
    const subtotalAfterVolume = subtotal - volumeDiscountAmount;

    const couponDiscountAmount = this.evaluateCoupon(coupon, subtotalAfterVolume, items);
    const totalDiscountAmount = Number((volumeDiscountAmount + couponDiscountAmount).toFixed(2));
    
    const taxableAmount = Math.max(0, subtotal - totalDiscountAmount);
    const taxRate = this.getTaxRate(country, state);
    const taxAmount = Number((taxableAmount * taxRate).toFixed(2));

    // Free shipping threshold: $50+
    const shippingFee = taxableAmount >= 50 || items.length === 0 ? 0 : 5.99;
    const grandTotal = Number((taxableAmount + taxAmount + shippingFee).toFixed(2));

    return {
      subtotal,
      volumeDiscountAmount,
      couponDiscountAmount,
      totalDiscountAmount,
      taxableAmount,
      taxAmount,
      shippingFee,
      grandTotal,
      currency,
      breakdown
    };
  }
}
