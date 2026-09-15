export interface SellerPerformanceInputs {
  sellerId: string;
  totalOrdersFulfilled: number;
  onTimeFulfillmentCount: number;
  orderCancellationsCount: number;
  returnDefectsCount: number;
  averageRating: number; // 1.0 to 5.0
  totalReviewsCount: number;
  avgResponseTimeHours: number;
  policyViolationsCount: number;
}

export interface SellerHealthScorecard {
  sellerId: string;
  overallScore: number; // 0 to 100
  tierStatus: 'TOP_RATED_PLUS' | 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'PROBATION';
  onTimeFulfillmentScore: number;
  defectRateScore: number;
  reviewSentimentScore: number;
  responseSlaScore: number;
  policyComplianceScore: number;
  eligibilityBadges: string[];
  recommendedImprovements: string[];
}

export class SellerReputationScoringEngine {
  /**
   * Computes holistic seller reputation score and performance tier
   */
  public static evaluateScorecard(inputs: SellerPerformanceInputs): SellerHealthScorecard {
    const orders = Math.max(1, inputs.totalOrdersFulfilled);

    // 1. On-Time Fulfillment Score (30%)
    const onTimeRate = (inputs.onTimeFulfillmentCount / orders) * 100;
    const fulfillmentScore = Math.min(100, Math.max(0, onTimeRate));

    // 2. Defect / Cancellation Penalty (25%)
    const defectRate = ((inputs.orderCancellationsCount + inputs.returnDefectsCount) / orders) * 100;
    const defectScore = Math.max(0, 100 - (defectRate * 20)); // -20 points per 1% defect rate

    // 3. Review Sentiment Score (25%)
    const reviewScore = Math.min(100, Math.max(0, ((inputs.averageRating - 1) / 4) * 100));

    // 4. Response Time SLA (10%)
    const responseScore = inputs.avgResponseTimeHours <= 4 ? 100 : inputs.avgResponseTimeHours <= 12 ? 85 : inputs.avgResponseTimeHours <= 24 ? 60 : 30;

    // 5. Policy Compliance (10%)
    const policyScore = Math.max(0, 100 - (inputs.policyViolationsCount * 35));

    // Composite Weighted Sum
    const composite = Math.round(
      (fulfillmentScore * 0.30 + defectScore * 0.25 + reviewScore * 0.25 + responseScore * 0.10 + policyScore * 0.10) * 10
    ) / 10;

    const badges: string[] = [];
    const improvements: string[] = [];

    let tier: SellerHealthScorecard['tierStatus'] = 'GOOD';

    if (composite >= 92 && orders >= 50 && inputs.averageRating >= 4.8) {
      tier = 'TOP_RATED_PLUS';
      badges.push('TOP_RATED_PLUS', 'FAST_SHIPPER', 'PREMIUM_SELLER');
    } else if (composite >= 80) {
      tier = 'EXCELLENT';
      badges.push('VERIFIED_MERCHANT');
    } else if (composite >= 65) {
      tier = 'GOOD';
    } else if (composite >= 50) {
      tier = 'NEEDS_ATTENTION';
      improvements.push('Reduce order cancellation rates and improve dispatch speed');
    } else {
      tier = 'PROBATION';
      improvements.push('Account at risk of suspension due to poor SLA compliance');
    }

    if (onTimeRate < 95) improvements.push('Dispatch orders within 24 hours of confirmation');
    if (inputs.avgResponseTimeHours > 12) improvements.push('Improve buyer inquiry response time to under 12 hours');

    return {
      sellerId: inputs.sellerId,
      overallScore: composite,
      tierStatus: tier,
      onTimeFulfillmentScore: Math.round(fulfillmentScore * 10) / 10,
      defectRateScore: Math.round(defectScore * 10) / 10,
      reviewSentimentScore: Math.round(reviewScore * 10) / 10,
      responseSlaScore: Math.round(responseScore * 10) / 10,
      policyComplianceScore: Math.round(policyScore * 10) / 10,
      eligibilityBadges: badges,
      recommendedImprovements: improvements,
    };
  }
}
