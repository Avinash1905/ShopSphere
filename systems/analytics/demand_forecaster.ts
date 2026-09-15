/**
 * ShopSphere Analytics Engine - Holt-Winters Exponential Smoothing & SKU Demand Forecaster
 * Features:
 * - Double / Triple Exponential Smoothing (Level + Trend)
 * - Restock lead-time demand calculation
 * - Safety stock reorder point estimation:
 *   $$\text{ROP} = \text{LeadTimeDemand} + Z \times \sigma_{\text{demand}} \times \sqrt{\text{LeadTime}}$$
 */

export interface ForecastPoint {
  period: number;
  forecast: number;
  lowerBound: number;
  upperBound: number;
}

export class DemandForecaster {
  /**
   * Holt’s Linear Exponential Smoothing (Level + Trend)
   */
  public static forecast(
    history: number[],
    periodsAhead: number = 7,
    alpha: number = 0.3, // Level smoothing factor
    beta: number = 0.1   // Trend smoothing factor
  ): ForecastPoint[] {
    if (history.length < 2) {
      const val = history[0] || 0;
      return Array.from({ length: periodsAhead }, (_, i) => ({
        period: i + 1,
        forecast: val,
        lowerBound: val,
        upperBound: val,
      }));
    }

    let level = history[0];
    let trend = history[1] - history[0];

    const residuals: number[] = [];

    for (let i = 1; i < history.length; i++) {
      const prevLevel = level;
      const prevTrend = trend;
      const actual = history[i];

      level = alpha * actual + (1 - alpha) * (prevLevel + prevTrend);
      trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;

      const fitted = prevLevel + prevTrend;
      residuals.push(actual - fitted);
    }

    // Calculate standard deviation of residuals for confidence intervals
    const meanRes = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
    const variance = residuals.reduce((sum, r) => sum + Math.pow(r - meanRes, 2), 0) / residuals.length;
    const stdDev = Math.sqrt(variance);

    const forecasts: ForecastPoint[] = [];
    for (let m = 1; m <= periodsAhead; m++) {
      const projected = level + m * trend;
      const margin = 1.96 * stdDev * Math.sqrt(m); // 95% confidence interval

      forecasts.push({
        period: m,
        forecast: Math.max(0, Math.round(projected * 100) / 100),
        lowerBound: Math.max(0, Math.round((projected - margin) * 100) / 100),
        upperBound: Math.max(0, Math.round((projected + margin) * 100) / 100),
      });
    }

    return forecasts;
  }

  /**
   * Calculates inventory Reorder Point (ROP) based on lead time and service level
   */
  public static calculateReorderPoint(
    dailyDemandHistory: number[],
    leadTimeDays: number = 7,
    serviceLevelZ: number = 1.65 // 95% service level
  ): { avgDailyDemand: number; safetyStock: number; reorderPoint: number } {
    if (dailyDemandHistory.length === 0) {
      return { avgDailyDemand: 0, safetyStock: 0, reorderPoint: 0 };
    }

    const avg = dailyDemandHistory.reduce((s, v) => s + v, 0) / dailyDemandHistory.length;
    const variance = dailyDemandHistory.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / dailyDemandHistory.length;
    const sigma = Math.sqrt(variance);

    const safetyStock = Math.ceil(serviceLevelZ * sigma * Math.sqrt(leadTimeDays));
    const leadTimeDemand = avg * leadTimeDays;
    const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);

    return {
      avgDailyDemand: Math.round(avg * 100) / 100,
      safetyStock,
      reorderPoint,
    };
  }
}
