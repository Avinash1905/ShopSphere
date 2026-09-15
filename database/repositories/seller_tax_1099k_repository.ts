import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { SellerTaxForm1099KTable } from '../schema/general_ledger.schema.js';

export interface MonthlyGrossVolume {
  month: number; // 1-12
  monthName: string;
  grossAmountUsd: number;
  transactionCount: number;
}

export interface Seller1099KCompilationReport {
  taxYear: number;
  sellerId: string;
  legalBusinessName: string;
  einTinLast4: string;
  isW9Verified: boolean;
  meetsFilingThreshold: boolean;
  totalGrossPaymentAmountUsd: number;
  totalTransactionCount: number;
  monthlyBreakdown: MonthlyGrossVolume[];
  filingStatus: SellerTaxForm1099KTable['filing_status'];
}

export class SellerTax1099KRepository {
  private db: MigrationDatabaseAdapter;

  // IRS 1099-K Standard Threshold (e.g. $600 / Any transaction volume under American Rescue Plan / State lower thresholds)
  public static readonly IRS_GROSS_THRESHOLD_USD = 600.0;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Compiles annual 1099-K tax summary for a seller across 12 calendar months
   */
  public async compileSeller1099K(
    sellerId: string,
    taxYear: number,
    legalBusinessName: string,
    einTinLast4: string,
    isW9Verified: boolean,
    monthlyGrossData: { month: number; gross: number; txCount: number }[]
  ): Promise<Seller1099KCompilationReport> {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthlyBreakdown: MonthlyGrossVolume[] = [];
    let totalGross = 0;
    let totalTxCount = 0;

    for (let m = 1; m <= 12; m++) {
      const match = monthlyGrossData.find(d => d.month === m);
      const gross = match ? match.gross : 0;
      const count = match ? match.txCount : 0;

      totalGross += gross;
      totalTxCount += count;

      fullMonthlyBreakdown.push({
        month: m,
        monthName: monthNames[m - 1],
        grossAmountUsd: Math.round(gross * 100) / 100,
        transactionCount: count,
      });
    }

    const roundedTotalGross = Math.round(totalGross * 100) / 100;
    const meetsThreshold = roundedTotalGross >= SellerTax1099KRepository.IRS_GROSS_THRESHOLD_USD;

    const id = `tax-1099k-${taxYear}-${sellerId}`;
    const now = new Date().toISOString();

    const record: SellerTaxForm1099KTable = {
      id,
      seller_id: sellerId,
      tax_year: taxYear,
      gross_payment_amount_usd: roundedTotalGross,
      transaction_count: totalTxCount,
      monthly_breakdown_json: JSON.stringify(fullMonthlyBreakdown),
      ein_tin_last4: einTinLast4,
      legal_business_name: legalBusinessName,
      is_w9_verified: isW9Verified,
      filing_status: meetsThreshold ? 'GENERATED' : 'PENDING_GENERATION',
      generated_at: now,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO seller_tax_form_1099k (
        id, seller_id, tax_year, gross_payment_amount_usd, transaction_count,
        monthly_breakdown_json, ein_tin_last4, legal_business_name,
        is_w9_verified, filing_status, generated_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.seller_id,
        record.tax_year,
        record.gross_payment_amount_usd,
        record.transaction_count,
        record.monthly_breakdown_json,
        record.ein_tin_last4,
        record.legal_business_name,
        record.is_w9_verified,
        record.filing_status,
        record.generated_at || null,
        record.created_at,
        record.updated_at,
      ]
    );

    return {
      taxYear,
      sellerId,
      legalBusinessName,
      einTinLast4,
      isW9Verified,
      meetsFilingThreshold: meetsThreshold,
      totalGrossPaymentAmountUsd: roundedTotalGross,
      totalTransactionCount: totalTxCount,
      monthlyBreakdown: fullMonthlyBreakdown,
      filingStatus: record.filing_status,
    };
  }
}
