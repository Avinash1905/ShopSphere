export interface CustomerTransactionHistory {
  userId: string;
  frequency: number; // Repeat transactions count x
  recencyWeeks: number; // Time of last transaction tx (in weeks)
  tenureWeeks: number; // Total customer age T (in weeks)
  monetaryValueAvg: number; // Average order value of repeat orders
}

export interface BayesianClvForecast {
  userId: string;
  probabilityAlivePercent: number; // P(Alive)
  expectedFutureTransactions12M: number;
  expectedAverageSpendPerTransaction: number;
  predicted12MonthClv: number;
  customerEquitySegment: 'TIER_1_VIP' | 'TIER_2_CORE' | 'TIER_3_OPPORTUNITY' | 'TIER_4_CHURNED';
}

export class CLVPredictiveBayesianModel {
  /**
   * Computes P(Alive) and conditional expected transactions using BG/NBD approximations
   * Default fitted hyper-parameters: r=0.24, alpha=4.41, a=0.79, b=2.42
   */
  public static forecastCustomerCLV(
    customer: CustomerTransactionHistory,
    r: number = 0.24,
    alpha: number = 4.41,
    a: number = 0.79,
    b: number = 2.42,
    discountRateAnnual: number = 0.10
  ): BayesianClvForecast {
    const x = customer.frequency;
    const tx = customer.recencyWeeks;
    const T = Math.max(tx, customer.tenureWeeks);
    const m = customer.monetaryValueAvg || 50;

    // 1. P(Alive) BG/NBD formula approximation
    // P(Alive) = 1 / (1 + (a / (b + x - 1)) * ((alpha + T) / (alpha + tx))^(r + x))
    const ratioTerm = (a / (b + Math.max(1, x))) * Math.pow((alpha + T) / (alpha + tx), r + x);
    const pAlive = Math.min(1.0, Math.max(0.0, 1.0 / (1.0 + ratioTerm)));

    // 2. Expected transactions in 52 weeks (12 months):
    // E[X(52)] = ((r + x) * (b + x - 1)) / ((alpha + T) * (a + b + x - 1)) * 52 * P(Alive)
    const baseRate = (r + x) / (alpha + T);
    const expectedTx52 = Math.round(baseRate * 52 * pAlive * 100) / 100;

    // 3. Gamma-Gamma spend expectation (mild shrinkage towards population mean $85)
    const POPULATION_MEAN_AOV = 85.0;
    const SHRINKAGE_WEIGHT = 0.25;
    const expectedSpend = Math.round((m * (1 - SHRINKAGE_WEIGHT) + POPULATION_MEAN_AOV * SHRINKAGE_WEIGHT) * 100) / 100;

    // 4. Net 12-Month CLV = Expected Transactions * Expected Spend * Margin (0.30) / (1 + DiscountRate)
    const MARGIN = 0.30;
    const predictedClv = Math.round(((expectedTx52 * expectedSpend * MARGIN) / (1 + discountRateAnnual)) * 100) / 100;

    let segment: BayesianClvForecast['customerEquitySegment'] = 'TIER_3_OPPORTUNITY';
    if (pAlive < 0.25) {
      segment = 'TIER_4_CHURNED';
    } else if (predictedClv >= 500) {
      segment = 'TIER_1_VIP';
    } else if (predictedClv >= 150) {
      segment = 'TIER_2_CORE';
    }

    return {
      userId: customer.userId,
      probabilityAlivePercent: Math.round(pAlive * 10000) / 100,
      expectedFutureTransactions12M: expectedTx52,
      expectedAverageSpendPerTransaction: expectedSpend,
      predicted12MonthClv: Math.max(0, predictedClv),
      customerEquitySegment: segment,
    };
  }
}
