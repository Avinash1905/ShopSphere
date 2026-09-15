import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import {
  GeneralLedgerRepository,
  SellerTax1099KRepository,
} from '../../database/repositories/index.js';
import {
  BalanceSheetIncomeStatementQueryEngine,
  FXRevaluationQueryEngine,
} from '../../database/queries/index.js';
import {
  FinancialRatioAnalyzer,
} from '../../systems/analytics/index.js';
import {
  AntiTamperAuditSeal,
} from '../../systems/security/index.js';

describe('General Ledger & Double-Entry Accounting Deep Dive (Phase 10)', () => {
  const db = new MockDatabaseAdapter();

  describe('GeneralLedgerRepository', () => {
    const repo = new GeneralLedgerRepository(db);

    it('should reject journal entries with fewer than 2 lines', async () => {
      let rejected = false;
      try {
        await repo.postJournalEntry({
          fiscalPeriodId: 'period_2026_09',
          postingDate: '2026-09-15',
          documentType: 'ORDER_FULFILLMENT',
          memo: 'Invalid single-line entry',
          createdByUserId: 'user_admin',
          lines: [
            { accountId: 'coa_1010', accountCode: '1010-CASH', debitAmount: 100, creditAmount: 0 },
          ],
        });
      } catch (err: any) {
        rejected = true;
        Assert.isTrue(err.message.includes('at least 2 lines'));
      }
      Assert.isTrue(rejected);
    });

    it('should reject unbalanced journal entries where Debits != Credits', async () => {
      let rejected = false;
      try {
        await repo.postJournalEntry({
          fiscalPeriodId: 'period_2026_09',
          postingDate: '2026-09-15',
          documentType: 'ORDER_FULFILLMENT',
          memo: 'Unbalanced entry',
          createdByUserId: 'user_admin',
          lines: [
            { accountId: 'coa_1010', accountCode: '1010-CASH', debitAmount: 100, creditAmount: 0 },
            { accountId: 'coa_4010', accountCode: '4010-REV', debitAmount: 0, creditAmount: 95 },
          ],
        });
      } catch (err: any) {
        rejected = true;
        Assert.isTrue(err.message.includes('out of balance'));
      }
      Assert.isTrue(rejected);
    });

    it('should successfully post a balanced multi-line double-entry transaction', async () => {
      const result = await repo.postJournalEntry({
        fiscalPeriodId: 'period_2026_09',
        postingDate: '2026-09-15',
        documentType: 'ORDER_FULFILLMENT',
        memo: 'Order #ORD-2026-9901 Balanced Fulfillment',
        createdByUserId: 'user_admin',
        lines: [
          { accountId: 'coa_1010', accountCode: '1010-CASH', debitAmount: 500, creditAmount: 0 },
          { accountId: 'coa_2300', accountCode: '2300-SELLER', debitAmount: 0, creditAmount: 425 },
          { accountId: 'coa_4010', accountCode: '4010-REV', debitAmount: 0, creditAmount: 50 },
          { accountId: 'coa_2200', accountCode: '2200-TAX', debitAmount: 0, creditAmount: 25 },
        ],
      });

      Assert.isTrue(result.isBalanced);
      Assert.equal(result.totalDebit, 500);
      Assert.equal(result.totalCredit, 500);
      Assert.equal(result.lines.length, 4);
      Assert.equal(result.journalEntry.status, 'POSTED');
    });

    it('should post an exact accounting reversal transaction', async () => {
      // First post original
      const original = await repo.postJournalEntry({
        fiscalPeriodId: 'period_2026_09',
        postingDate: '2026-09-15',
        documentType: 'SELLER_FEE',
        memo: 'Accidental Fee Deduction',
        createdByUserId: 'user_admin',
        lines: [
          { accountId: 'coa_1010', accountCode: '1010-CASH', debitAmount: 75, creditAmount: 0 },
          { accountId: 'coa_4010', accountCode: '4010-REV', debitAmount: 0, creditAmount: 75 },
        ],
      });

      const reversal = await repo.reverseJournalEntry(original.journalEntry.id, 'user_auditor', 'Reversing accidental fee');
      Assert.isTrue(reversal.isBalanced);
      Assert.equal(reversal.totalDebit, 75);
      Assert.equal(reversal.totalCredit, 75);
      Assert.equal(reversal.journalEntry.document_type, 'MANUAL_ADJUSTMENT');
    });
  });

  describe('SellerTax1099KRepository', () => {
    const repo = new SellerTax1099KRepository(db);

    it('should compile 12-month 1099-K tax breakdown and evaluate threshold', async () => {
      const monthlyData = [
        { month: 1, gross: 1200, txCount: 15 },
        { month: 2, gross: 1500, txCount: 20 },
        { month: 3, gross: 800, txCount: 10 },
      ];

      const report = await repo.compileSeller1099K(
        'seller_tech_01',
        2026,
        'Tech Innovators LLC',
        '9876',
        true,
        monthlyData
      );

      Assert.isTrue(!!report);
      Assert.equal(report.taxYear, 2026);
      Assert.equal(report.sellerId, 'seller_tech_01');
      Assert.equal(report.totalGrossPaymentAmountUsd, 3500);
      Assert.equal(report.totalTransactionCount, 45);
      Assert.equal(report.monthlyBreakdown.length, 12);
      Assert.isTrue(report.meetsFilingThreshold);
      Assert.equal(report.filingStatus, 'GENERATED');
    });
  });

  describe('BalanceSheetIncomeStatementQueryEngine', () => {
    const engine = new BalanceSheetIncomeStatementQueryEngine(db);

    it('should generate balanced balance sheet report', async () => {
      const bs = await engine.generateBalanceSheet('2026-09-30');
      Assert.isTrue(!!bs);
      Assert.equal(bs.asOfDate, '2026-09-30');
      Assert.isTrue(Array.isArray(bs.assetAccounts));
      Assert.isTrue(Array.isArray(bs.liabilityAccounts));
      Assert.isTrue(Array.isArray(bs.equityAccounts));
    });

    it('should generate income statement report with profitability margins', async () => {
      const pnl = await engine.generateIncomeStatement('2026-01-01', '2026-09-30');
      Assert.isTrue(!!pnl);
      Assert.equal(typeof pnl.grossRevenueUsd, 'number');
      Assert.equal(typeof pnl.costOfGoodsAndServicesUsd, 'number');
      Assert.equal(typeof pnl.grossProfitUsd, 'number');
      Assert.equal(typeof pnl.grossMarginPercent, 'number');
      Assert.equal(typeof pnl.netOperatingIncomeUsd, 'number');
    });
  });

  describe('FXRevaluationQueryEngine', () => {
    const engine = new FXRevaluationQueryEngine(db);

    it('should compute foreign currency position revaluation against spot rates', async () => {
      const summary = await engine.computePeriodEndFXRevaluation('2026-09-30', {
        EUR: 1.09,
        GBP: 1.30,
        JPY: 0.0070,
        CAD: 0.75,
        AUD: 0.67,
      });

      Assert.isTrue(!!summary);
      Assert.equal(summary.revaluationDate, '2026-09-30');
      Assert.equal(summary.baseCurrency, 'USD');
      Assert.isTrue(Array.isArray(summary.currencyBreakdown));
      Assert.equal(typeof summary.netUnrealizedGainLossUsd, 'number');
    });
  });

  describe('FinancialRatioAnalyzer', () => {
    it('should calculate liquidity, profitability, and cash conversion cycle ratios', () => {
      const bs = {
        cashAndEquivalents: 150000,
        accountsReceivable: 50000,
        inventory: 100000,
        otherCurrentAssets: 20000,
        totalCurrentAssets: 320000,
        accountsPayable: 80000,
        shortTermDebt: 20000,
        accruedLiabilities: 10000,
        totalCurrentLiabilities: 110000,
        totalLongTermDebt: 50000,
        totalEquity: 250000,
      };

      const is = {
        grossRevenue: 600000,
        costOfGoodsSold: 360000,
        operatingExpenses: 120000,
        depreciationAndAmortization: 15000,
        interestExpense: 5000,
        taxExpense: 20000,
        netIncome: 95000,
      };

      const report = FinancialRatioAnalyzer.analyzeFinancialPerformance('Q3-2026', bs, is);
      Assert.isTrue(!!report);
      Assert.equal(report.period, 'Q3-2026');

      // Liquidity
      Assert.equal(report.liquidity.currentRatio, Math.round((320000 / 110000) * 100) / 100);
      Assert.equal(report.liquidity.quickRatio, Math.round((200000 / 110000) * 100) / 100);
      Assert.isTrue(report.liquidity.isLiquidityHealthy);

      // Profitability
      Assert.equal(report.profitability.grossProfitMarginPercent, 40); // (240k / 600k) * 100
      Assert.equal(report.profitability.operatingProfitMarginPercent, 20); // (120k / 600k) * 100
      Assert.equal(report.profitability.netProfitMarginPercent, 15.83); // (95k / 600k) * 100

      // Working Capital Efficiency
      Assert.isTrue(report.workingCapitalEfficiency.daysSalesOutstandingDso > 0);
      Assert.isTrue(report.workingCapitalEfficiency.daysInventoryOutstandingDio > 0);
      Assert.isTrue(report.workingCapitalEfficiency.daysPayableOutstandingDpo > 0);
    });
  });

  describe('AntiTamperAuditSeal', () => {
    it('should generate Merkle root and verify cryptographic seal over fiscal period', () => {
      const entries = [
        {
          id: 'je_1',
          entry_number: 'JE-001',
          fiscal_period_id: 'p_1',
          posting_date: '2026-09-01',
          document_type: 'ORDER_FULFILLMENT' as const,
          memo: 'Order 1',
          status: 'POSTED' as const,
          total_debit: 100,
          total_credit: 100,
          created_by_user_id: 'u1',
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ];

      const lines = [
        { id: 'l1', journal_entry_id: 'je_1', account_id: 'a1', account_code: '1010-CASH', line_number: 1, debit_amount: 100, credit_amount: 0, created_at: '2026-09-01T00:00:00Z' },
        { id: 'l2', journal_entry_id: 'je_1', account_id: 'a2', account_code: '4010-REV', line_number: 2, debit_amount: 0, credit_amount: 100, created_at: '2026-09-01T00:00:00Z' },
      ];

      const certificate = AntiTamperAuditSeal.sealFiscalPeriod('p_1', 2026, 9, 'auditor_01', entries, lines);
      Assert.isTrue(!!certificate);
      Assert.equal(certificate.fiscalYear, 2026);
      Assert.equal(certificate.periodNumber, 9);
      Assert.isTrue(certificate.merkleRootHash.length > 0);

      // Verify authentic seal
      const isValid = AntiTamperAuditSeal.verifyPeriodSeal(certificate, entries, lines);
      Assert.isTrue(isValid);

      // Verify tampered entries are caught
      const tamperedEntries = [{ ...entries[0], total_debit: 999 }];
      const isTamperedValid = AntiTamperAuditSeal.verifyPeriodSeal(certificate, tamperedEntries, lines);
      Assert.isTrue(!isTamperedValid);
    });
  });
});
