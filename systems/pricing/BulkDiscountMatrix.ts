export interface DiscountTier {
  minQuantity: number;
  maxQuantity?: number;
  discountPercentage: number;
}

export class BulkDiscountMatrix {
  private tiers: DiscountTier[] = [];

  constructor(tiers?: DiscountTier[]) {
    if (tiers) this.tiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  }

  public addTier(tier: DiscountTier): void {
    this.tiers.push(tier);
    this.tiers.sort((a, b) => a.minQuantity - b.minQuantity);
  }

  public calculateTieredPrice(baseUnitPrice: number, quantity: number): { unitPrice: number; totalPrice: number; discountApplied: number } {
    let applicablePercentage = 0;
    for (const tier of this.tiers) {
      if (quantity >= tier.minQuantity) {
        if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
          applicablePercentage = tier.discountPercentage;
        }
      }
    }
    const unitPrice = +(baseUnitPrice * (1 - applicablePercentage / 100)).toFixed(2);
    const totalPrice = +(unitPrice * quantity).toFixed(2);
    const discountApplied = +((baseUnitPrice * quantity) - totalPrice).toFixed(2);
    return { unitPrice, totalPrice, discountApplied };
  }
}
