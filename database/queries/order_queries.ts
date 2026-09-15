import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface OrderSummaryMetrics {
  totalOrders: number;
  totalGrandTotal: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
  paymentBreakdown: Record<string, number>;
}

export class OrderQueries {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async getOrderSummaryMetrics(sellerId?: string, startDate?: string, endDate?: string): Promise<OrderSummaryMetrics> {
    const qb = QueryBuilder.select(
      'COUNT(*) as total_orders',
      'COALESCE(SUM(grand_total), 0) as total_grand_total',
      'COALESCE(AVG(grand_total), 0) as avg_order_value'
    ).from('orders');

    if (sellerId) qb.where('seller_id = ?', sellerId);
    if (startDate) qb.where('created_at >= ?', startDate);
    if (endDate) qb.where('created_at <= ?', endDate);

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    // Status breakdown
    const statusQb = QueryBuilder.select('order_status', 'COUNT(*) as count').from('orders');
    if (sellerId) statusQb.where('seller_id = ?', sellerId);
    if (startDate) statusQb.where('created_at >= ?', startDate);
    if (endDate) statusQb.where('created_at <= ?', endDate);
    statusQb.groupBy('order_status');

    const statusSQL = statusQb.toSQL();
    const statusRows = await this.db.query<{ order_status: string; count: number }>(statusSQL.sql, statusSQL.params);
    const statusBreakdown: Record<string, number> = {};
    for (const r of statusRows) {
      statusBreakdown[r.order_status] = Number(r.count);
    }

    // Payment breakdown
    const payQb = QueryBuilder.select('payment_status', 'COUNT(*) as count').from('orders');
    if (sellerId) payQb.where('seller_id = ?', sellerId);
    if (startDate) payQb.where('created_at >= ?', startDate);
    if (endDate) payQb.where('created_at <= ?', endDate);
    payQb.groupBy('payment_status');

    const paySQL = payQb.toSQL();
    const payRows = await this.db.query<{ payment_status: string; count: number }>(paySQL.sql, paySQL.params);
    const paymentBreakdown: Record<string, number> = {};
    for (const r of payRows) {
      paymentBreakdown[r.payment_status] = Number(r.count);
    }

    return {
      totalOrders: Number(rows[0]?.total_orders || 0),
      totalGrandTotal: Math.round(Number(rows[0]?.total_grand_total || 0) * 100) / 100,
      avgOrderValue: Math.round(Number(rows[0]?.avg_order_value || 0) * 100) / 100,
      statusBreakdown,
      paymentBreakdown,
    };
  }

  public async getDailySalesTrend(sellerId?: string, days: number = 30): Promise<{ date: string; orders: number; revenue: number }[]> {
    const qb = QueryBuilder.select(
      "DATE(created_at) as order_date",
      'COUNT(id) as orders_count',
      'COALESCE(SUM(grand_total), 0) as daily_revenue'
    )
      .from('orders')
      .where("order_status NOT IN ('CANCELLED', 'REFUNDED')");

    if (sellerId) qb.where('seller_id = ?', sellerId);
    qb.groupBy('DATE(created_at)').orderBy('order_date', 'ASC').limit(days);

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<{ order_date: string; orders_count: number; daily_revenue: number }>(sql, params);
    return rows.map((r) => ({
      date: r.order_date,
      orders: Number(r.orders_count),
      revenue: Math.round(Number(r.daily_revenue) * 100) / 100,
    }));
  }
}
