import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface SellerTierConfig {
  tierName: 'PLATINUM' | 'GOLD' | 'SILVER' | 'STANDARD';
  minMonthlyGmv: number;
  commissionRate: number; // e.g. 0.05 for 5%
  holdbackDays: number; // 7 days for Platinum, 14 for Gold, 21 for Standard
  reserveRate: number; // 0.02 for Platinum, 0.05 for Standard
}

export interface SellerPayoutRecord {
  payoutId: string;
  sellerId: string;
  businessName: string;
  tier: string;
  periodStart: string;
  periodEnd: string;
  grossMerchandiseValue: number;
  platformFee: number;
  paymentProcessingFee: number;
  refundDeductions: number;
  reserveWithheld: number;
  reserveReleased: number;
  taxDeductions: number;
  netDisbursement: number;
  currency: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSED' | 'FAILED' | 'ON_HOLD';
  eligibleItemCount: number;
}

export interface LedgerAuditEntry {
  entryId: string;
  sellerId: string;
  orderId?: string;
  entryType: 'CREDIT' | 'DEBIT';
  accountType: 'ESCROW' | 'PAYABLE' | 'RESERVE' | 'COMMISSION' | 'TAX';
  amount: number;
  currency: string;
  description: string;
  postedAt: string;
}

export class SellerPayoutLedgerQueryEngine {
  private db: MigrationDatabaseAdapter;

  private static readonly TIERS: Record<string, SellerTierConfig> = {
    PLATINUM: { tierName: 'PLATINUM', minMonthlyGmv: 100000, commissionRate: 0.045, holdbackDays: 7, reserveRate: 0.02 },
    GOLD: { tierName: 'GOLD', minMonthlyGmv: 25000, commissionRate: 0.065, holdbackDays: 10, reserveRate: 0.035 },
    SILVER: { tierName: 'SILVER', minMonthlyGmv: 5000, commissionRate: 0.08, holdbackDays: 14, reserveRate: 0.05 },
    STANDARD: { tierName: 'STANDARD', minMonthlyGmv: 0, commissionRate: 0.10, holdbackDays: 21, reserveRate: 0.08 },
  };

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Determine seller tier based on trailing 30-day GMV
   */
  public async getSellerTier(sellerId: string, asOfDate: string = new Date().toISOString()): Promise<SellerTierConfig> {
    const qb = QueryBuilder.select('COALESCE(SUM(grand_total), 0) AS trailing_gmv')
      .from('orders')
      .where('seller_id = ?', sellerId)
      .where("order_status NOT IN ('CANCELLED', 'REFUNDED')")
      .where('created_at <= ?', asOfDate);

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<{ trailing_gmv: number }>(sql, params);
    const trailingGmv = Number(rows[0]?.trailing_gmv || 0);

    if (trailingGmv >= SellerPayoutLedgerQueryEngine.TIERS.PLATINUM.minMonthlyGmv) {
      return SellerPayoutLedgerQueryEngine.TIERS.PLATINUM;
    }
    if (trailingGmv >= SellerPayoutLedgerQueryEngine.TIERS.GOLD.minMonthlyGmv) {
      return SellerPayoutLedgerQueryEngine.TIERS.GOLD;
    }
    if (trailingGmv >= SellerPayoutLedgerQueryEngine.TIERS.SILVER.minMonthlyGmv) {
      return SellerPayoutLedgerQueryEngine.TIERS.SILVER;
    }
    return SellerPayoutLedgerQueryEngine.TIERS.STANDARD;
  }

  /**
   * Compile seller payout ledger for a given period
   */
  public async compilePayoutLedger(
    sellerId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<SellerPayoutRecord> {
    const tier = await this.getSellerTier(sellerId, periodEnd);

    // Fetch orders completed in period
    const qb = QueryBuilder.select(
      'o.id',
      'o.grand_total',
      'o.order_status',
      's.business_name',
      'p.amount AS paid_amount',
      'p.refunded_amount'
    )
      .from('orders', 'o')
      .innerJoin('sellers', 's.id = o.seller_id', 's')
      .leftJoin('payments', 'p.order_id = o.id', 'p')
      .where('o.seller_id = ?', sellerId)
      .where("o.order_status = 'DELIVERED'")
      .where('o.created_at >= ?', periodStart)
      .where('o.created_at <= ?', periodEnd);

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    let gmv = 0;
    let totalRefunds = 0;
    const businessName = rows[0]?.business_name || 'Seller';

    for (const r of rows) {
      gmv += Number(r.grand_total || 0);
      totalRefunds += Number(r.refunded_amount || 0);
    }

    const netSales = Math.max(0, gmv - totalRefunds);
    const platformFee = Math.round(netSales * tier.commissionRate * 100) / 100;
    const paymentProcessingFee = Math.round((netSales * 0.02 + rows.length * 0.15) * 100) / 100;
    const reserveWithheld = Math.round(netSales * tier.reserveRate * 100) / 100;
    // Simulated reserve release from prior cycle (e.g. 50% of current reserve)
    const reserveReleased = Math.round(reserveWithheld * 0.5 * 100) / 100;
    const taxDeductions = Math.round(netSales * 0.01 * 100) / 100; // 1% TCS/TDS

    const netDisbursement = Math.max(
      0,
      Math.round((netSales - platformFee - paymentProcessingFee - reserveWithheld + reserveReleased - taxDeductions) * 100) / 100
    );

    return {
      payoutId: `PAYOUT-${sellerId.substring(0, 8)}-${Date.now()}`,
      sellerId,
      businessName,
      tier: tier.tierName,
      periodStart,
      periodEnd,
      grossMerchandiseValue: Math.round(gmv * 100) / 100,
      platformFee,
      paymentProcessingFee,
      refundDeductions: Math.round(totalRefunds * 100) / 100,
      reserveWithheld,
      reserveReleased,
      taxDeductions,
      netDisbursement,
      currency: 'USD',
      status: netDisbursement > 0 ? 'APPROVED' : 'PENDING_APPROVAL',
      eligibleItemCount: rows.length,
    };
  }

  /**
   * Generates double-entry accounting audit trail entries for an executed payout
   */
  public generateAuditEntries(payout: SellerPayoutRecord): LedgerAuditEntry[] {
    const timestamp = new Date().toISOString();
    const entries: LedgerAuditEntry[] = [
      {
        entryId: `AUD-${Date.now()}-1`,
        sellerId: payout.sellerId,
        entryType: 'CREDIT',
        accountType: 'ESCROW',
        amount: payout.grossMerchandiseValue,
        currency: payout.currency,
        description: `Gross settlement credit for period ${payout.periodStart} to ${payout.periodEnd}`,
        postedAt: timestamp,
      },
      {
        entryId: `AUD-${Date.now()}-2`,
        sellerId: payout.sellerId,
        entryType: 'DEBIT',
        accountType: 'COMMISSION',
        amount: payout.platformFee,
        currency: payout.currency,
        description: `Platform commission (${payout.tier} tier)`,
        postedAt: timestamp,
      },
      {
        entryId: `AUD-${Date.now()}-3`,
        sellerId: payout.sellerId,
        entryType: 'DEBIT',
        accountType: 'RESERVE',
        amount: payout.reserveWithheld,
        currency: payout.currency,
        description: `Rolling dispute reserve holdback`,
        postedAt: timestamp,
      },
      {
        entryId: `AUD-${Date.now()}-4`,
        sellerId: payout.sellerId,
        entryType: 'DEBIT',
        accountType: 'PAYABLE',
        amount: payout.netDisbursement,
        currency: payout.currency,
        description: `Disbursement transfer to seller linked bank account`,
        postedAt: timestamp,
      },
    ];

    return entries;
  }
}
