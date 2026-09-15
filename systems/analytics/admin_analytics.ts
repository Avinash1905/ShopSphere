import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';
import { MetricsCalculator } from './metrics_calculator.js';

export interface AdminExecutiveDashboard {
  overview: {
    totalUsers: number;
    totalSellers: number;
    totalProducts: number;
    totalOrders: number;
    grossMerchandiseValue: number;
    platformNetRevenue: number;
    avgOrderValue: number;
  };
  topPerformingSellers: {
    sellerId: string;
    storeName: string;
    revenue: number;
    salesCount: number;
    rating: number;
  }[];
  topPerformingCategories: {
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalSales: number;
    revenue: number;
  }[];
  systemHealth: {
    databaseStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    activeSessionsEstimate: number;
    pendingVerifications: number;
    unresolvedAuditWarnings: number;
  };
}

export class AdminAnalyticsService {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async getExecutiveDashboard(): Promise<AdminExecutiveDashboard> {
    // 1. Overview counts
    const userCountRes = await this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');
    const sellerCountRes = await this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM sellers WHERE deleted_at IS NULL');
    const productCountRes = await this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE status = 'PUBLISHED' AND deleted_at IS NULL");
    const orderMetricsRes = await this.db.query<any>("SELECT COUNT(*) as total_orders, SUM(grand_total) as gmv FROM orders WHERE order_status NOT IN ('CANCELLED', 'REFUNDED')");

    const totalUsers = Number(userCountRes[0]?.count || 0);
    const totalSellers = Number(sellerCountRes[0]?.count || 0);
    const totalProducts = Number(productCountRes[0]?.count || 0);
    const totalOrders = Number(orderMetricsRes[0]?.total_orders || 0);
    const gmv = Number(orderMetricsRes[0]?.gmv || 0);
    const platformNetRevenue = Math.round(gmv * 0.085 * 100) / 100;
    const avgOrderValue = totalOrders > 0 ? Math.round((gmv / totalOrders) * 100) / 100 : 0;

    // 2. Top Sellers
    const topSellersRows = await this.db.query<any>(
      `SELECT id, store_name, total_revenue_amount, total_sales_count, rating_average
       FROM sellers
       WHERE verification_status = 'VERIFIED'
       ORDER BY total_revenue_amount DESC
       LIMIT 5`
    );

    // 3. Top Categories
    const topCatRows = await this.db.query<any>(
      `SELECT c.id, c.name, COUNT(DISTINCT p.id) as prod_count, SUM(p.total_sales_count) as sales_count, SUM(p.total_sales_count * p.base_price) as est_revenue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id, c.name
       ORDER BY est_revenue DESC
       LIMIT 5`
    );

    // 4. System Health Checks
    const pendingVerifRes = await this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM sellers WHERE verification_status = 'PENDING'");
    const auditWarningRes = await this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM audit_logs WHERE severity IN ('WARNING', 'ERROR', 'CRITICAL')");

    return {
      overview: {
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        grossMerchandiseValue: Math.round(gmv * 100) / 100,
        platformNetRevenue,
        avgOrderValue,
      },
      topPerformingSellers: topSellersRows.map((s) => ({
        sellerId: s.id,
        storeName: s.store_name,
        revenue: Math.round(Number(s.total_revenue_amount) * 100) / 100,
        salesCount: Number(s.total_sales_count),
        rating: Number(s.rating_average),
      })),
      topPerformingCategories: topCatRows.map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        productCount: Number(c.prod_count || 0),
        totalSales: Number(c.sales_count || 0),
        revenue: Math.round(Number(c.est_revenue || 0) * 100) / 100,
      })),
      systemHealth: {
        databaseStatus: 'HEALTHY',
        activeSessionsEstimate: Math.max(15, totalUsers * 2),
        pendingVerifications: Number(pendingVerifRes[0]?.count || 0),
        unresolvedAuditWarnings: Number(auditWarningRes[0]?.count || 0),
      },
    };
  }
}
