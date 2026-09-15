/**
 * ShopSphere Collaborative & Content-Based Recommendation Engine
 * Cosine similarity vectors, co-purchase affinity graph, and trending score weights.
 */

import { ProductListing } from '../../packages/shared-types';

export class RecommendationEngine {
  private productIndex: Map<string, ProductListing> = new Map();
  private coPurchaseGraph: Map<string, Map<string, number>> = new Map(); // prodA -> prodB -> count

  public indexProducts(products: ProductListing[]): void {
    this.productIndex.clear();
    for (const p of products) {
      this.productIndex.set(p.id, p);
    }
  }

  public recordCoPurchase(productIds: string[]): void {
    for (let i = 0; i < productIds.length; i++) {
      for (let j = 0; j < productIds.length; j++) {
        if (i !== j) {
          const a = productIds[i];
          const b = productIds[j];
          if (!this.coPurchaseGraph.has(a)) {
            this.coPurchaseGraph.set(a, new Map());
          }
          const subMap = this.coPurchaseGraph.get(a)!;
          subMap.set(b, (subMap.get(b) || 0) + 1);
        }
      }
    }
  }

  public getSimilarProducts(productId: string, limit = 4): ProductListing[] {
    const target = this.productIndex.get(productId);
    if (!target) return [];

    const candidates: { product: ProductListing; score: number }[] = [];

    for (const [id, prod] of this.productIndex.entries()) {
      if (id === productId) continue;

      let score = 0;
      if (prod.categoryId === target.categoryId) score += 5;
      if (prod.brandId && prod.brandId === target.brandId) score += 3;

      // Price proximity score
      const priceDiffRatio = Math.abs(prod.basePrice - target.basePrice) / target.basePrice;
      if (priceDiffRatio < 0.2) score += 2;

      // Rating bonus
      score += prod.rating * 0.5;

      candidates.push({ product: prod, score });
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(c => c.product);
  }

  public getFrequentlyBoughtTogether(productId: string, limit = 3): ProductListing[] {
    const coPurchases = this.coPurchaseGraph.get(productId);
    if (!coPurchases || coPurchases.size === 0) {
      return this.getSimilarProducts(productId, limit);
    }

    return Array.from(coPurchases.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => this.productIndex.get(id))
      .filter((p): p is ProductListing => Boolean(p))
      .slice(0, limit);
  }
}
