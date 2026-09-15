import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { B2BCorporateInvoiceTable } from '../schema/b2b_wholesale.schema.js';

export interface AgingBucketSummary {
  currentUsd: number; // Not overdue
  days1To30Usd: number;
  days31To60Usd: number;
  days61To90Usd: number;
  over90DaysUsd: number;
  totalOutstandingUsd: number;
}

export interface CompanyAgingReport {
  companyId: string;
  totalOpenInvoices: number;
  aging: AgingBucketSummary;
  recommendedDunningAction: 'NONE' | 'FRIENDLY_REMINDER' | 'URGENT_WARNING' | 'CREDIT_HOLD_ENFORCEMENT' | 'COLLECTIONS_AGENCY';
  invoices: Array<{
    invoiceNumber: string;
    amountUsd: number;
    unpaidBalanceUsd: number;
    dueDate: string;
    daysOverdue: number;
    dunningStage: number;
  }>;
}

export class B2BDunningAgingReceivablesQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Generates accounts receivable aging matrix and dunning action recommendations
   */
  public async generateAgingReport(
    companyId: string,
    asOfDate: string = new Date().toISOString().substring(0, 10)
  ): Promise<CompanyAgingReport> {
    const invoices = await this.db.query<B2BCorporateInvoiceTable>(
      "SELECT * FROM b2b_corporate_invoices WHERE company_id = ? AND payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')",
      [companyId]
    );

    const asOfMs = new Date(asOfDate).getTime();
    let current = 0;
    let d1to30 = 0;
    let d31to60 = 0;
    let d61to90 = 0;
    let over90 = 0;

    const invoiceList: CompanyAgingReport['invoices'] = [];

    for (const inv of invoices) {
      const unpaid = Math.round((inv.invoice_amount_usd - inv.paid_amount_usd) * 100) / 100;
      const dueMs = new Date(inv.due_date).getTime();
      const diffDays = Math.floor((asOfMs - dueMs) / 86400000);

      if (diffDays <= 0) {
        current += unpaid;
      } else if (diffDays <= 30) {
        d1to30 += unpaid;
      } else if (diffDays <= 60) {
        d31to60 += unpaid;
      } else if (diffDays <= 90) {
        d61to90 += unpaid;
      } else {
        over90 += unpaid;
      }

      invoiceList.push({
        invoiceNumber: inv.invoice_number,
        amountUsd: inv.invoice_amount_usd,
        unpaidBalanceUsd: unpaid,
        dueDate: inv.due_date,
        daysOverdue: Math.max(0, diffDays),
        dunningStage: inv.dunning_stage,
      });
    }

    const totalOutstanding = Math.round((current + d1to30 + d31to60 + d61to90 + over90) * 100) / 100;

    let dunningAction: CompanyAgingReport['recommendedDunningAction'] = 'NONE';
    if (over90 > 0) {
      dunningAction = 'COLLECTIONS_AGENCY';
    } else if (d61to90 > 0) {
      dunningAction = 'CREDIT_HOLD_ENFORCEMENT';
    } else if (d31to60 > 0) {
      dunningAction = 'URGENT_WARNING';
    } else if (d1to30 > 0) {
      dunningAction = 'FRIENDLY_REMINDER';
    }

    return {
      companyId,
      totalOpenInvoices: invoices.length,
      aging: {
        currentUsd: Math.round(current * 100) / 100,
        days1To30Usd: Math.round(d1to30 * 100) / 100,
        days31To60Usd: Math.round(d31to60 * 100) / 100,
        days61To90Usd: Math.round(d61to90 * 100) / 100,
        over90DaysUsd: Math.round(over90 * 100) / 100,
        totalOutstandingUsd: totalOutstanding,
      },
      recommendedDunningAction: dunningAction,
      invoices: invoiceList,
    };
  }
}
