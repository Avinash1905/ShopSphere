import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';
import { MetricsCalculator } from './metrics_calculator.js';

export interface CustomerSummaryProfile {
  userId: string;
  email: string;
  fullName: string;
  totalSpend: number;
  totalOrders: number;
  avgOrderValue: number;
  customerLifetimeValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  purchaseIntervalDaysAvg: number;
  favoriteCategories: { categoryId: string; categoryName: string; orderCount: number; spend: number }[];
  favoriteBrands: { brandId: string; brandName: string; orderCount: number; spend: number }[];
  rfmSegment: string;
}

export class CustomerAnalyticsService {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async getCustomerAnalytics(userId: string): Promise<CustomerSummaryProfile | null> {
    const userRows = await this.db.query<any>(`SELECT id, email, first_name, last_name FROM users WHERE id = ?`, [userId]);
    if (userRows.length === 0) return null;
    const user = userRows[0];

    // Orders query
    const orders = await this.db.query<any>(
      `SELECT id, grand_total, created_at FROM orders WHERE user_id = ? AND order_status NOT IN ('CANCELLED', 'REFUNDED') ORDER BY created_at ASC`,
      [userId]
    );

    const totalOrders = orders.length;
    const totalSpend = MetricsCalculator.sum(orders.map((o) => Number(o.grand_total)));
    const avgOrderValue = totalOrders > 0 ? Math.round((totalSpend / totalOrders) * 100) / 100 : 0;
    const firstOrderDate = orders[0]?.created_at || '';
    const lastOrderDate = orders[orders.length - 1]?.created_at || '';

    // Calculate purchase intervals
    let avgInterval = 0;
    if (orders.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < orders.length; i++) {
        const diffDays = (new Date(orders[i].created_at).getTime() - new Date(orders[i - 1].created_at).getTime()) / (1000 * 3600 * 24);
        intervals.push(diffDays);
      }
      avgInterval = Math.round(MetricsCalculator.mean(intervals) * 10) / 10;
    }

    const clv = MetricsCalculator.customerLifetimeValue(avgOrderValue, Math.max(1, (totalOrders / 2) || 1));

    // Favorite Categories
    const catRows = await this.db.query<any>(
      `SELECT c.id, c.name, COUNT(oi.id) as order_count, SUM(oi.total_price) as spend
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       INNER JOIN products p ON p.id = oi.product_id
       INNER JOIN categories c ON c.id = p.category_id
       WHERE o.user_id = ? AND o.order_status NOT IN ('CANCELLED', 'REFUNDED')
       GROUP BY c.id, c.name
       ORDER BY spend DESC
       LIMIT 5`,
      [userId]
    );

    // Favorite Brands
    const brandRows = await this.db.query<any>(
      `SELECT b.id, b.name, COUNT(oi.id) as order_count, SUM(oi.total_price) as spend
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       INNER JOIN products p ON p.id = oi.product_id
       INNER JOIN brands b ON b.id = p.brand_id
       WHERE o.user_id = ? AND o.order_status NOT IN ('CANCELLED', 'REFUNDED')
       GROUP BY b.id, b.name
       ORDER BY spend DESC
       LIMIT 5`,
      [userId]
    );

    let rfmSegment = 'NEW_CUSTOMER';
    if (totalOrders >= 5 && totalSpend >= 2000) rfmSegment = 'CHAMPION';
    else if (totalOrders >= 3 && totalSpend >= 1000) rfmSegment = 'LOYAL_CUSTOMER';
    else if (totalOrders >= 1 && totalSpend >= 300) rfmSegment = 'POTENTIAL_LOYALIST';

    return {
      userId,
      email: user.email,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalOrders,
      avgOrderValue,
      customerLifetimeValue: clv,
      firstOrderDate,
      lastOrderDate,
      purchaseIntervalDaysAvg: avgInterval,
      favoriteCategories: catRows.map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        orderCount: Number(c.order_count),
        spend: Math.round(Number(c.spend) * 100) / 100,
      })),
      favoriteBrands: brandRows.map((b) => ({
        brandId: b.id,
        brandName: b.name,
        orderCount: Number(b.order_count),
        spend: Math.round(Number(b.spend) * 100) / 100,
      })),
      rfmSegment,
    };
  }
}
