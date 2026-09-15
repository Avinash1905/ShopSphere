/**
 * ShopSphere Analytics Engine - RFM Customer Segmentation
 * Features:
 * - Recency (days since last purchase)
 * - Frequency (total number of orders placed)
 * - Monetary (total lifetime expenditure)
 * - Automated quintile (1-5) scoring
 * - Segment classification: Champions, Loyal, Potential Loyalists, At Risk, Hibernating, Lost
 */

export interface CustomerRFMInput {
  customerId: string;
  lastOrderDate: Date;
  orderCount: number;
  totalSpend: number;
}

export interface RFMScore {
  customerId: string;
  recencyDays: number;
  rScore: number; // 1 to 5 (5 is best/most recent)
  fScore: number; // 1 to 5 (5 is highest frequency)
  mScore: number; // 1 to 5 (5 is highest spend)
  rfmScoreString: string; // e.g. "555", "452"
  segment: 'CHAMPIONS' | 'LOYAL_CUSTOMERS' | 'POTENTIAL_LOYALISTS' | 'AT_RISK' | 'HIBERNATING' | 'LOST';
  recommendedAction: string;
}

export class RFMSegmentationEngine {
  public static calculateRFM(customers: CustomerRFMInput[], referenceDate: Date = new Date()): RFMScore[] {
    if (customers.length === 0) return [];

    const now = referenceDate.getTime();
    const dataWithRecency = customers.map((c) => ({
      ...c,
      recencyDays: Math.max(0, Math.floor((now - c.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))),
    }));

    // Calculate percentiles
    const sortedR = [...dataWithRecency].sort((a, b) => a.recencyDays - b.recencyDays); // Lower recency is better
    const sortedF = [...dataWithRecency].sort((a, b) => b.orderCount - a.orderCount); // Higher frequency is better
    const sortedM = [...dataWithRecency].sort((a, b) => b.totalSpend - a.totalSpend); // Higher spend is better

    const getQuintile = (index: number, total: number): number => {
      const p = index / total;
      if (p <= 0.2) return 5;
      if (p <= 0.4) return 4;
      if (p <= 0.6) return 3;
      if (p <= 0.8) return 2;
      return 1;
    };

    const rMap = new Map<string, number>();
    const fMap = new Map<string, number>();
    const mMap = new Map<string, number>();

    sortedR.forEach((item, idx) => rMap.set(item.customerId, getQuintile(idx, sortedR.length)));
    sortedF.forEach((item, idx) => fMap.set(item.customerId, getQuintile(idx, sortedF.length)));
    sortedM.forEach((item, idx) => mMap.set(item.customerId, getQuintile(idx, sortedM.length)));

    return dataWithRecency.map((c) => {
      const r = rMap.get(c.customerId) || 3;
      const f = fMap.get(c.customerId) || 3;
      const m = mMap.get(c.customerId) || 3;
      const rfmStr = `${r}${f}${m}`;

      let segment: RFMScore['segment'];
      let action: string;

      if (r >= 4 && f >= 4 && m >= 4) {
        segment = 'CHAMPIONS';
        action = 'Reward with VIP loyalty perks, early product access, and brand ambassador incentives.';
      } else if (r >= 3 && f >= 3) {
        segment = 'LOYAL_CUSTOMERS';
        action = 'Upsell higher-margin products and offer subscription or membership tiers.';
      } else if (r >= 4 && f <= 2) {
        segment = 'POTENTIAL_LOYALISTS';
        action = 'Engage with targeted onboarding discounts to drive repeat second purchase.';
      } else if (r <= 2 && f >= 3) {
        segment = 'AT_RISK';
        action = 'Send urgent win-back campaigns and personalized high-value discount coupons.';
      } else if (r <= 2 && f <= 2 && m >= 3) {
        segment = 'HIBERNATING';
        action = 'Reactivate with seasonal catalog updates and brand highlight newsletters.';
      } else {
        segment = 'LOST';
        action = 'Low-priority re-engagement through automated programmatic remarketing.';
      }

      return {
        customerId: c.customerId,
        recencyDays: c.recencyDays,
        rScore: r,
        fScore: f,
        mScore: m,
        rfmScoreString: rfmStr,
        segment,
        recommendedAction: action,
      };
    });
  }
}
