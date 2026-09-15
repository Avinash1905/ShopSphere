/**
 * ShopSphere Real-Time Analytics & Telemetry Engine
 * Aggregates GMV, AOV, seller conversion funnels, customer cohorts, and category velocity.
 */

export interface SalesMetricPoint {
  date: string;
  revenue: number;
  orders: number;
  unitsSold: number;
  aov: number;
}

export interface SellerPerformanceMetric {
  sellerId: string;
  sellerName: string;
  period: string;
  grossRevenue: number;
  netRevenue: number;
  commissionPaid: number;
  totalOrders: number;
  fulfillmentRate: number;
  returnRate: number;
  avgRating: number;
  topSellingProducts: { productId: string; title: string; units: number; revenue: number }[];
}

export interface PlatformExecutiveSummary {
  period: string;
  totalGMV: number;
  platformRevenue: number;
  activeCustomers: number;
  activeSellers: number;
  totalTransactions: number;
  averageOrderValue: number;
  cartAbandonmentRate: number;
  topCategories: { categoryId: string; categoryName: string; gmv: number; sharePercentage: number }[];
  cohortRetention: { cohortMonth: string; size: number; m1: number; m2: number; m3: number; m6: number }[];
}

export class AnalyticsEngine {
  private salesHistory: SalesMetricPoint[] = [];

  public calculateAOV(totalRevenue: number, totalOrders: number): number {
    if (totalOrders <= 0) return 0;
    return Number((totalRevenue / totalOrders).toFixed(2));
  }

  public calculateConversionRate(visitors: number, conversions: number): number {
    if (visitors <= 0) return 0;
    return Number(((conversions / visitors) * 100).toFixed(2));
  }

  public calculateReturnRate(totalOrders: number, returnedOrders: number): number {
    if (totalOrders <= 0) return 0;
    return Number(((returnedOrders / totalOrders) * 100).toFixed(2));
  }

  public aggregateDailyMetrics(orders: { createdAt: string; totalAmount: number; itemsCount: number }[]): SalesMetricPoint[] {
    const dayMap = new Map<string, { revenue: number; orders: number; units: number }>();

    for (const order of orders) {
      const dateKey = order.createdAt.split('T')[0];
      const existing = dayMap.get(dateKey) || { revenue: 0, orders: 0, units: 0 };
      existing.revenue += order.totalAmount;
      existing.orders += 1;
      existing.units += order.itemsCount;
      dayMap.set(dateKey, existing);
    }

    return Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: Number(data.revenue.toFixed(2)),
        orders: data.orders,
        unitsSold: data.units,
        aov: this.calculateAOV(data.revenue, data.orders)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
