/**
 * ShopSphere Database Repositories - Seller Settlements & Disbursement Ledger
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface SellerSettlement {
  id: string;
  seller_id: string;
  settlement_period_start: string;
  settlement_period_end: string;
  gross_sales_amount: number;
  marketplace_commission_amount: number;
  refund_deductions_amount: number;
  adjustments_amount: number;
  net_payout_amount: number;
  currency: string;
  status: 'PENDING' | 'CALCULATED' | 'PROCESSING' | 'PAID' | 'FAILED';
  payout_account_id?: string;
  transferred_at?: string;
  created_at: string;
}

export class SellerSettlementRepository extends BaseRepository<SellerSettlement> {
  constructor(db: MigrationDatabaseAdapter) {
    super('seller_settlements', db);
  }

  public async calculatePeriodSettlement(
    sellerId: string,
    periodStart: Date,
    periodEnd: Date,
    commissionRatePercentage: number = 10.0
  ): Promise<SellerSettlement> {
    const id = `settle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const startStr = periodStart.toISOString();
    const endStr = periodEnd.toISOString();

    // Query completed orders for seller in period
    const salesSql = `
      SELECT COALESCE(SUM(oi.total_price), 0) as gross_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE p.seller_id = ?
        AND o.status = 'DELIVERED'
        AND o.created_at >= ?
        AND o.created_at <= ?
    `;
    const salesRes = await this.db.query<{ gross_sales: number }>(salesSql, [sellerId, startStr, endStr]);
    const grossSales = Number(salesRes[0]?.gross_sales || 0);

    const commission = Number(((grossSales * commissionRatePercentage) / 100).toFixed(2));
    const netPayout = Number((grossSales - commission).toFixed(2));

    return this.create({
      id,
      seller_id: sellerId,
      settlement_period_start: startStr,
      settlement_period_end: endStr,
      gross_sales_amount: grossSales,
      marketplace_commission_amount: commission,
      refund_deductions_amount: 0,
      adjustments_amount: 0,
      net_payout_amount: netPayout,
      currency: 'USD',
      status: 'CALCULATED',
      created_at: now,
    });
  }

  public async markPaid(settlementId: string, payoutAccountId: string): Promise<SellerSettlement> {
    const now = new Date().toISOString();
    return this.update(settlementId, {
      status: 'PAID',
      payout_account_id: payoutAccountId,
      transferred_at: now,
    } as any);
  }

  public async getPendingSettlementsForSeller(sellerId: string): Promise<SellerSettlement[]> {
    const res = await this.findAll({
      where: [
        { field: 'seller_id', operator: 'EQ', value: sellerId },
        { field: 'status', operator: 'IN', value: ['PENDING', 'CALCULATED'] },
      ],
      sort: [{ field: 'settlement_period_end', direction: 'DESC' }],
    });
    return res.data;
  }
}
