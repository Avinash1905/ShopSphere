import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { GLJournalEntryLineTable, GLChartOfAccountTable } from '../schema/general_ledger.schema.js';

export interface BalanceSheetSummary {
  asOfDate: string;
  totalAssetsUsd: number;
  totalLiabilitiesUsd: number;
  totalEquityUsd: number;
  isBalanced: boolean;
  varianceUsd: number;
  assetAccounts: Array<{ code: string; name: string; balance: number }>;
  liabilityAccounts: Array<{ code: string; name: string; balance: number }>;
  equityAccounts: Array<{ code: string; name: string; balance: number }>;
}

export interface IncomeStatementSummary {
  periodStartDate: string;
  periodEndDate: string;
  grossRevenueUsd: number;
  costOfGoodsAndServicesUsd: number;
  grossProfitUsd: number;
  grossMarginPercent: number;
  operatingExpensesUsd: number;
  netOperatingIncomeUsd: number;
  netMarginPercent: number;
  revenueAccounts: Array<{ code: string; name: string; amount: number }>;
  expenseAccounts: Array<{ code: string; name: string; amount: number }>;
}

export class BalanceSheetIncomeStatementQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Generates GAAP-compliant Balance Sheet and verifies Fundamental Accounting Equation (Assets = Liabilities + Equity)
   */
  public async generateBalanceSheet(asOfDate: string): Promise<BalanceSheetSummary> {
    const accounts = await this.db.query<GLChartOfAccountTable>('SELECT * FROM gl_chart_of_accounts WHERE is_active = TRUE');
    const lines = await this.db.query<GLJournalEntryLineTable>('SELECT * FROM gl_journal_entry_lines');

    const accountBalances: Record<string, number> = {};
    for (const line of lines) {
      if (!accountBalances[line.account_id]) {
        accountBalances[line.account_id] = 0;
      }
      accountBalances[line.account_id] += (line.debit_amount - line.credit_amount);
    }

    const assetList: Array<{ code: string; name: string; balance: number }> = [];
    const liabilityList: Array<{ code: string; name: string; balance: number }> = [];
    const equityList: Array<{ code: string; name: string; balance: number }> = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const acc of accounts) {
      const rawNet = accountBalances[acc.id] || 0;
      if (acc.account_category === 'ASSET') {
        const bal = acc.normal_balance === 'DEBIT' ? rawNet : -rawNet;
        totalAssets += bal;
        assetList.push({ code: acc.account_code, name: acc.account_name, balance: Math.round(bal * 100) / 100 });
      } else if (acc.account_category === 'LIABILITY') {
        const bal = acc.normal_balance === 'CREDIT' ? -rawNet : rawNet;
        totalLiabilities += bal;
        liabilityList.push({ code: acc.account_code, name: acc.account_name, balance: Math.round(bal * 100) / 100 });
      } else if (acc.account_category === 'EQUITY') {
        const bal = acc.normal_balance === 'CREDIT' ? -rawNet : rawNet;
        totalEquity += bal;
        equityList.push({ code: acc.account_code, name: acc.account_name, balance: Math.round(bal * 100) / 100 });
      }
    }

    const roundedAssets = Math.round(totalAssets * 100) / 100;
    const roundedLiabilities = Math.round(totalLiabilities * 100) / 100;
    const roundedEquity = Math.round(totalEquity * 100) / 100;
    const variance = Math.round(Math.abs(roundedAssets - (roundedLiabilities + roundedEquity)) * 100) / 100;

    return {
      asOfDate,
      totalAssetsUsd: roundedAssets,
      totalLiabilitiesUsd: roundedLiabilities,
      totalEquityUsd: roundedEquity,
      isBalanced: variance <= 0.05,
      varianceUsd: variance,
      assetAccounts: assetList,
      liabilityAccounts: liabilityList,
      equityAccounts: equityList,
    };
  }

  /**
   * Generates Income Statement (Profit & Loss Statement)
   */
  public async generateIncomeStatement(startDate: string, endDate: string): Promise<IncomeStatementSummary> {
    const accounts = await this.db.query<GLChartOfAccountTable>('SELECT * FROM gl_chart_of_accounts WHERE is_active = TRUE');
    const lines = await this.db.query<GLJournalEntryLineTable>('SELECT * FROM gl_journal_entry_lines');

    const accountBalances: Record<string, number> = {};
    for (const line of lines) {
      if (!accountBalances[line.account_id]) {
        accountBalances[line.account_id] = 0;
      }
      accountBalances[line.account_id] += (line.debit_amount - line.credit_amount);
    }

    const revenueList: Array<{ code: string; name: string; amount: number }> = [];
    const expenseList: Array<{ code: string; name: string; amount: number }> = [];

    let grossRevenue = 0;
    let cogs = 0;
    let opex = 0;

    for (const acc of accounts) {
      const rawNet = accountBalances[acc.id] || 0;
      if (acc.account_category === 'REVENUE') {
        const rev = acc.normal_balance === 'CREDIT' ? -rawNet : rawNet;
        grossRevenue += rev;
        revenueList.push({ code: acc.account_code, name: acc.account_name, amount: Math.round(rev * 100) / 100 });
      } else if (acc.account_category === 'EXPENSE') {
        const exp = acc.normal_balance === 'DEBIT' ? rawNet : -rawNet;
        if (acc.account_subtype === 'COGS') {
          cogs += exp;
        } else {
          opex += exp;
        }
        expenseList.push({ code: acc.account_code, name: acc.account_name, amount: Math.round(exp * 100) / 100 });
      }
    }

    const roundedRevenue = Math.round(grossRevenue * 100) / 100;
    const roundedCogs = Math.round(cogs * 100) / 100;
    const grossProfit = Math.round((roundedRevenue - roundedCogs) * 100) / 100;
    const grossMarginPercent = roundedRevenue > 0 ? Math.round((grossProfit / roundedRevenue) * 10000) / 100 : 0;
    const roundedOpex = Math.round(opex * 100) / 100;
    const netIncome = Math.round((grossProfit - roundedOpex) * 100) / 100;
    const netMarginPercent = roundedRevenue > 0 ? Math.round((netIncome / roundedRevenue) * 10000) / 100 : 0;

    return {
      periodStartDate: startDate,
      periodEndDate: endDate,
      grossRevenueUsd: roundedRevenue,
      costOfGoodsAndServicesUsd: roundedCogs,
      grossProfitUsd: grossProfit,
      grossMarginPercent,
      operatingExpensesUsd: roundedOpex,
      netOperatingIncomeUsd: netIncome,
      netMarginPercent,
      revenueAccounts: revenueList,
      expenseAccounts: expenseList,
    };
  }
}
