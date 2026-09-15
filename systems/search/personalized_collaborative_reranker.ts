export interface PersonalizedUserAffinityProfile {
  userId: string;
  favoriteCategories: Map<string, number>; // Category slug -> weight (0.0 to 1.0)
  favoriteBrands: Map<string, number>; // Brand slug -> weight (0.0 to 1.0)
  preferredPriceTier: 'BUDGET' | 'MID_RANGE' | 'PREMIUM';
  pastPurchasedProductIds: Set<string>;
  recentlyViewedProductIds: string[];
}

export interface CandidateSearchItem {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  baseRankScore: number;
  metadata?: Record<string, any>;
}

export interface PersonalizedRankResult extends CandidateSearchItem {
  personalizedScore: number;
  personalizationBoostDelta: number;
  boostReasons: string[];
}

export class PersonalizedCollaborativeReranker {
  /**
   * Reranks candidate search items based on a user's affinity profile
   */
  public static rerank(
    items: CandidateSearchItem[],
    profile?: PersonalizedUserAffinityProfile,
    personalizationWeight: number = 0.35
  ): PersonalizedRankResult[] {
    if (!profile) {
      return items.map((item) => ({
        ...item,
        personalizedScore: item.baseRankScore,
        personalizationBoostDelta: 0,
        boostReasons: ['Default unbiased ranking (anonymous user)'],
      }));
    }

    const results: PersonalizedRankResult[] = [];

    for (const item of items) {
      let boostFactor = 0;
      const reasons: string[] = [];

      // 1. Category Affinity Boost
      if (item.category && profile.favoriteCategories.has(item.category)) {
        const catWeight = profile.favoriteCategories.get(item.category)!;
        const add = catWeight * 0.4;
        boostFactor += add;
        reasons.push(`High category affinity for '${item.category}' (+${Math.round(add * 100)}%)`);
      }

      // 2. Brand Affinity Boost
      if (item.brand && profile.favoriteBrands.has(item.brand)) {
        const brandWeight = profile.favoriteBrands.get(item.brand)!;
        const add = brandWeight * 0.35;
        boostFactor += add;
        reasons.push(`Brand loyalty affinity for '${item.brand}' (+${Math.round(add * 100)}%)`);
      }

      // 3. Price Tier Preference
      if (profile.preferredPriceTier === 'PREMIUM' && item.price >= 500) {
        boostFactor += 0.15;
        reasons.push('Matches premium price tier preference (+15%)');
      } else if (profile.preferredPriceTier === 'BUDGET' && item.price <= 50) {
        boostFactor += 0.15;
        reasons.push('Matches budget price tier preference (+15%)');
      }

      // 4. Recently viewed items slight re-engagement boost
      if (profile.recentlyViewedProductIds.includes(item.id)) {
        boostFactor += 0.2;
        reasons.push('Recently viewed item re-engagement (+20%)');
      }

      // 5. Past purchased duplicate item penalty (avoid repetitive repurchases unless consumable)
      if (profile.pastPurchasedProductIds.has(item.id)) {
        boostFactor -= 0.1;
        reasons.push('Previously purchased item penalty (-10%)');
      }

      const totalMultiplier = 1.0 + (boostFactor * personalizationWeight);
      const personalizedScore = Math.round(item.baseRankScore * totalMultiplier * 1000) / 1000;
      const delta = Math.round((personalizedScore - item.baseRankScore) * 1000) / 1000;

      results.push({
        ...item,
        personalizedScore,
        personalizationBoostDelta: delta,
        boostReasons: reasons.length > 0 ? reasons : ['Baseline relevance'],
      });
    }

    results.sort((a, b) => b.personalizedScore - a.personalizedScore);
    return results;
  }
}
