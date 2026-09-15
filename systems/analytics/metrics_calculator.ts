export class MetricsCalculator {
  public static sum(values: number[]): number {
    return values.reduce((acc, val) => acc + (val || 0), 0);
  }

  public static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return this.sum(values) / values.length;
  }

  public static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  public static variance(values: number[]): number {
    if (values.length <= 1) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
    return this.sum(squareDiffs) / (values.length - 1);
  }

  public static standardDeviation(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  public static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    if (p <= 0) return Math.min(...values);
    if (p >= 100) return Math.max(...values);

    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  public static growthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }

  /**
   * Customer Lifetime Value (CLV) = (AOV * Purchase Frequency) * Customer Lifespan
   */
  public static customerLifetimeValue(
    averageOrderValue: number,
    purchaseFrequencyPerYear: number,
    averageLifespanYears: number = 3,
    grossMarginPercentage: number = 0.25
  ): number {
    const clv = averageOrderValue * purchaseFrequencyPerYear * averageLifespanYears * grossMarginPercentage;
    return Math.round(clv * 100) / 100;
  }

  /**
   * Linear Regression trend slope & intercept for forecasting
   */
  public static linearRegression(yValues: number[]): { slope: number; intercept: number; nextProjected: number } {
    const n = yValues.length;
    if (n === 0) return { slope: 0, intercept: 0, nextProjected: 0 };
    if (n === 1) return { slope: 0, intercept: yValues[0], nextProjected: yValues[0] };

    const xValues = Array.from({ length: n }, (_, i) => i);
    const xSum = this.sum(xValues);
    const ySum = this.sum(yValues);
    const xxSum = this.sum(xValues.map((x) => x * x));
    const xySum = this.sum(xValues.map((x, i) => x * yValues[i]));

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum || 1);
    const intercept = (ySum - slope * xSum) / n;
    const nextProjected = Math.max(0, slope * n + intercept);

    return {
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 1000) / 1000,
      nextProjected: Math.round(nextProjected * 100) / 100,
    };
  }
}
