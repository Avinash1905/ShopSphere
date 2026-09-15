import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface FinancialPerformanceSummary {
  grossMerchandiseValue: number;
  netRevenue: number;
  totalDiscounts: number;
  totalTaxCollected: number;
  totalShippingFees: number;
  totalRefunds: number;
  platformCommissionEarned: number;
  sellerPayoutObligations: number;
}

export class FinancialQueries {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async getFinancialPerformance(startDate?: string, endDate?: string): Promise<FinancialPerformanceSummary> {
    const qb = QueryBuilder.select(
      'COALESCE(SUM(grand_total), 0) as gmv',
      'COALESCE(SUM(subtotal_amount), 0) as subtotal',
      'COALESCE(SUM(discount_amount), 0) as discounts',
      'COALESCE(SUM(tax_amount), 0) as taxes',
      'COALESCE(SUM(shipping_fee), 0) as shipping'
    )
      .from('orders')
      .where("order_status NOT IN ('CANCELLED', 'REFUNDED')");

    if (startDate) qb.where('created_at >= ?', startDate);
    if (endDate) qb.where('created_at <= ?', endDate);

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    // Total refunds from payments table
    const refQb = QueryBuilder.select('COALESCE(SUM(refunded_amount), 0) as total_refunds').from('payments');
    if (startDate) refQb.where('created_at >= ?', startDate);
    if (endDate) refQb.where('created_at <= ?', endDate);
    const refSQL = refQb.toSQL();
    const refRows = await this.db.query<{ total_refunds: number }>(refSQL.sql, refSQL.params);

    const gmv = Number(rows[0]?.gmv || 0);
    const discounts = Number(rows[0]?.discounts || 0);
    const taxes = Number(rows[0]?.taxes || 0);
    const shipping = Number(rows[0]?.shipping || 0);
    const totalRefunds = Number(refRows[0]?.total_refunds || 0);
    const netRevenue = Math.max(0, gmv - totalRefunds);

    // Platform average take rate approx 8.5%
    const platformCommissionEarned = Math.round(netRevenue * 0.085 * 100) / 100;
    const sellerPayoutObligations = Math.round((netRevenue - platformCommissionEarned) * 100) / 100;

    return {
      grossMerchandiseValue: Math.round(gmv * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      totalDiscounts: Math.round(discounts * 100) / 100,
      totalTaxCollected: Math.round(taxes * 100) / 100,
      totalShippingFees: Math.round(shipping * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      platformCommissionEarned,
      sellerPayoutObligations,
    };
  }
}
