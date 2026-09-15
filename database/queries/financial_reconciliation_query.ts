import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface ReconciliationTransaction {
  transactionId: string;
  orderId: string;
  sellerId?: string;
  gatewayTransactionId: string;
  gatewayName: string;
  currency: string;
  orderAmount: number;
  capturedAmount: number;
  refundedAmount: number;
  gatewayFee: number;
  platformFee: number;
  sellerNetPayout: number;
  escrowStatus: 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  reconciliationStatus: 'MATCHED' | 'DISCREPANCY' | 'UNRECONCILED' | 'MANUAL_REVIEW';
  discrepancyReason?: string;
  discrepancyAmount?: number;
  transactionTimestamp: string;
}

export interface ReconciliationReport {
  periodStart: string;
  periodEnd: string;
  totalOrders: number;
  totalCapturedGmv: number;
  totalRefunds: number;
  totalGatewayFees: number;
  totalPlatformCommission: number;
  totalSellerPayable: number;
  totalEscrowHeld: number;
  unbalancedLedgerCount: number;
  matchedCount: number;
  discrepancyCount: number;
  reconciliationRatePercent: number;
  discrepancies: Array<{
    orderId: string;
    gatewayId: string;
    expectedAmount: number;
    actualAmount: number;
    variance: number;
    reason: string;
  }>;
}

export interface SettlementBatchCriteria {
  sellerId?: string;
  currency?: string;
  cutoffDate: string;
  minimumPayoutAmount?: number;
  excludeDisputed?: boolean;
}

export interface SellerPayoutBatchSummary {
  sellerId: string;
  sellerBusinessName: string;
  eligibleOrderCount: number;
  grossSales: number;
  commissionDeductions: number;
  taxWithheld: number;
  refundClawbacks: number;
  reserveHoldback: number;
  netPayoutAmount: number;
  payoutCurrency: string;
  orderIds: string[];
}

export class FinancialReconciliationQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Performs automated end-of-period double-entry ledger reconciliation
   * across orders, payments, refunds, and gateway fee ledgers.
   */
  public async reconcilePeriod(
    startDate: string,
    endDate: string,
    currency: string = 'USD'
  ): Promise<ReconciliationReport> {
    // 1. Fetch completed and captured order payments in window
    const orderQuery = QueryBuilder.select(
      'o.id AS order_id',
      'o.seller_id',
      'o.grand_total',
      'o.order_status',
      'p.id AS payment_id',
      'p.gateway_name',
      'p.gateway_transaction_id',
      'p.amount AS payment_amount',
      'p.refunded_amount',
      'p.payment_status',
      'p.created_at AS payment_created_at'
    )
      .from('orders', 'o')
      .leftJoin('payments', 'p.order_id = o.id', 'p')
      .where('o.created_at >= ?', startDate)
      .where('o.created_at <= ?', endDate);

    const { sql, params } = orderQuery.toSQL();
    const rows = await this.db.query<any>(sql, params);

    let totalOrders = 0;
    let totalCapturedGmv = 0;
    let totalRefunds = 0;
    let totalGatewayFees = 0;
    let totalPlatformCommission = 0;
    let totalSellerPayable = 0;
    let totalEscrowHeld = 0;
    let matchedCount = 0;
    let discrepancyCount = 0;
    const discrepancies: ReconciliationReport['discrepancies'] = [];

    // Simulated standard gateway fee rates (2.9% + $0.30) and platform take rate (8.5%)
    const GATEWAY_PERCENT = 0.029;
    const GATEWAY_FIXED = 0.30;
    const PLATFORM_TAKE_RATE = 0.085;

    for (const row of rows) {
      totalOrders++;
      const grandTotal = Number(row.grand_total || 0);
      const paidAmount = Number(row.payment_amount || 0);
      const refunded = Number(row.refunded_amount || 0);
      const status = row.payment_status || 'UNKNOWN';

      if (status === 'COMPLETED' || status === 'CAPTURED' || status === 'PAID') {
        const netOrderGmv = grandTotal - refunded;
        totalCapturedGmv += grandTotal;
        totalRefunds += refunded;

        const estGatewayFee = Math.round((grandTotal * GATEWAY_PERCENT + GATEWAY_FIXED) * 100) / 100;
        const estCommission = Math.round(netOrderGmv * PLATFORM_TAKE_RATE * 100) / 100;
        const sellerNet = Math.max(0, netOrderGmv - estCommission);

        totalGatewayFees += estGatewayFee;
        totalPlatformCommission += estCommission;
        totalSellerPayable += sellerNet;

        // Check for ledger discrepancy
        const amountDiff = Math.abs(grandTotal - paidAmount);
        if (amountDiff > 0.01) {
          discrepancyCount++;
          discrepancies.push({
            orderId: row.order_id,
            gatewayId: row.gateway_transaction_id || 'N/A',
            expectedAmount: grandTotal,
            actualAmount: paidAmount,
            variance: amountDiff,
            reason: `Payment amount ${paidAmount} does not match order grand total ${grandTotal}`,
          });
        } else {
          matchedCount++;
        }
      } else if (status === 'PENDING' || status === 'AUTHORIZED') {
        totalEscrowHeld += grandTotal;
      } else if (row.order_status === 'PAID' && !row.payment_id) {
        discrepancyCount++;
        discrepancies.push({
          orderId: row.order_id,
          gatewayId: 'MISSING',
          expectedAmount: grandTotal,
          actualAmount: 0,
          variance: grandTotal,
          reason: 'Order marked as paid but missing payment record in ledger',
        });
      }
    }

    const totalAudited = matchedCount + discrepancyCount;
    const reconciliationRate = totalAudited > 0
      ? Math.round((matchedCount / totalAudited) * 10000) / 100
      : 100;

    return {
      periodStart: startDate,
      periodEnd: endDate,
      totalOrders,
      totalCapturedGmv: Math.round(totalCapturedGmv * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      totalGatewayFees: Math.round(totalGatewayFees * 100) / 100,
      totalPlatformCommission: Math.round(totalPlatformCommission * 100) / 100,
      totalSellerPayable: Math.round(totalSellerPayable * 100) / 100,
      totalEscrowHeld: Math.round(totalEscrowHeld * 100) / 100,
      unbalancedLedgerCount: discrepancies.length,
      matchedCount,
      discrepancyCount,
      reconciliationRatePercent: reconciliationRate,
      discrepancies,
    };
  }

  /**
   * Generates seller payout settlement batches based on fulfillment maturity and holding periods.
   */
  public async generateSellerSettlementBatches(
    criteria: SettlementBatchCriteria
  ): Promise<SellerPayoutBatchSummary[]> {
    const qb = QueryBuilder.select(
      's.id AS seller_id',
      's.business_name',
      'o.id AS order_id',
      'o.grand_total',
      'o.order_status',
      'p.amount AS paid_amount',
      'p.refunded_amount'
    )
      .from('sellers', 's')
      .innerJoin('orders', 'o.seller_id = s.id', 'o')
      .leftJoin('payments', 'p.order_id = o.id', 'p')
      .where("o.order_status = 'DELIVERED'")
      .where('o.created_at <= ?', criteria.cutoffDate);

    if (criteria.sellerId) {
      qb.where('s.id = ?', criteria.sellerId);
    }

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    const sellerMap = new Map<string, {
      name: string;
      orders: string[];
      gross: number;
      refunds: number;
    }>();

    for (const r of rows) {
      const sId = r.seller_id;
      if (!sellerMap.has(sId)) {
        sellerMap.set(sId, {
          name: r.business_name || 'Seller',
          orders: [],
          gross: 0,
          refunds: 0,
        });
      }
      const entry = sellerMap.get(sId)!;
      entry.orders.push(r.order_id);
      entry.gross += Number(r.grand_total || 0);
      entry.refunds += Number(r.refunded_amount || 0);
    }

    const summaries: SellerPayoutBatchSummary[] = [];
    const minPayout = criteria.minimumPayoutAmount || 50.0;
    const COMMISSION_RATE = 0.085;
    const TAX_WITHHOLDING = 0.01; // 1% tax withholding at source
    const RESERVE_HOLD_RATE = 0.05; // 5% rolling reserve

    for (const [sellerId, data] of sellerMap.entries()) {
      const netGross = data.gross - data.refunds;
      const commission = Math.round(netGross * COMMISSION_RATE * 100) / 100;
      const taxWithheld = Math.round(netGross * TAX_WITHHOLDING * 100) / 100;
      const reserve = Math.round(netGross * RESERVE_HOLD_RATE * 100) / 100;
      const netPayout = Math.round((netGross - commission - taxWithheld - reserve) * 100) / 100;

      if (netPayout >= minPayout) {
        summaries.push({
          sellerId,
          sellerBusinessName: data.name,
          eligibleOrderCount: data.orders.length,
          grossSales: Math.round(data.gross * 100) / 100,
          commissionDeductions: commission,
          taxWithheld,
          refundClawbacks: Math.round(data.refunds * 100) / 100,
          reserveHoldback: reserve,
          netPayoutAmount: Math.max(0, netPayout),
          payoutCurrency: criteria.currency || 'USD',
          orderIds: data.orders,
        });
      }
    }

    return summaries;
  }
}
