export interface BalanceSheetData {
  cashAndEquivalents: number;
  accountsReceivable: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  accountsPayable: number;
  shortTermDebt: number;
  accruedLiabilities: number;
  totalCurrentLiabilities: number;
  totalLongTermDebt: number;
  totalEquity: number;
}

export interface IncomeStatementData {
  grossRevenue: number;
  costOfGoodsSold: number;
  operatingExpenses: number;
  depreciationAndAmortization: number;
  interestExpense: number;
  taxExpense: number;
  netIncome: number;
}

export interface FinancialRatioReport {
  period: string;
  liquidity: {
    currentRatio: number; // Current Assets / Current Liabilities
    quickRatio: number; // (Cash + AR) / Current Liabilities
    cashRatio: number; // Cash / Current Liabilities
    workingCapitalUsd: number;
    isLiquidityHealthy: boolean;
  };
  profitability: {
    grossProfitMarginPercent: number;
    operatingProfitMarginPercent: number;
    ebitdaMarginPercent: number;
    netProfitMarginPercent: number;
    returnOnEquityPercent: number;
  };
  workingCapitalEfficiency: {
    daysSalesOutstandingDso: number; // (AR / Revenue) * 365
    daysInventoryOutstandingDio: number; // (Inventory / COGS) * 365
    daysPayableOutstandingDpo: number; // (AP / COGS) * 365
    cashConversionCycleDays: number; // DSO + DIO - DPO
  };
  solvency: {
    debtToEquityRatio: number;
    interestCoverageRatio: number; // EBIT / Interest
  };
}

export class FinancialRatioAnalyzer {
  /**
   * Computes comprehensive enterprise financial ratios from balance sheet and income statement feeds
   */
  public static analyzeFinancialPerformance(
    period: string,
    bs: BalanceSheetData,
    is: IncomeStatementData
  ): FinancialRatioReport {
    // 1. Liquidity
    const currentRatio = bs.totalCurrentLiabilities > 0
      ? Math.round((bs.totalCurrentAssets / bs.totalCurrentLiabilities) * 100) / 100
      : 999.0;

    const quickAssets = bs.cashAndEquivalents + bs.accountsReceivable;
    const quickRatio = bs.totalCurrentLiabilities > 0
      ? Math.round((quickAssets / bs.totalCurrentLiabilities) * 100) / 100
      : 999.0;

    const cashRatio = bs.totalCurrentLiabilities > 0
      ? Math.round((bs.cashAndEquivalents / bs.totalCurrentLiabilities) * 100) / 100
      : 999.0;

    const workingCapital = Math.round((bs.totalCurrentAssets - bs.totalCurrentLiabilities) * 100) / 100;
    const isLiquidityHealthy = currentRatio >= 1.2 && quickRatio >= 0.8;

    // 2. Profitability
    const grossProfit = is.grossRevenue - is.costOfGoodsSold;
    const grossMargin = is.grossRevenue > 0 ? Math.round((grossProfit / is.grossRevenue) * 10000) / 100 : 0;

    const operatingIncome = grossProfit - is.operatingExpenses;
    const operatingMargin = is.grossRevenue > 0 ? Math.round((operatingIncome / is.grossRevenue) * 10000) / 100 : 0;

    const ebitda = operatingIncome + is.depreciationAndAmortization;
    const ebitdaMargin = is.grossRevenue > 0 ? Math.round((ebitda / is.grossRevenue) * 10000) / 100 : 0;

    const netMargin = is.grossRevenue > 0 ? Math.round((is.netIncome / is.grossRevenue) * 10000) / 100 : 0;
    const roe = bs.totalEquity > 0 ? Math.round((is.netIncome / bs.totalEquity) * 10000) / 100 : 0;

    // 3. Working Capital Efficiency (365 day basis)
    const dso = is.grossRevenue > 0 ? Math.round(((bs.accountsReceivable / is.grossRevenue) * 365) * 10) / 10 : 0;
    const dio = is.costOfGoodsSold > 0 ? Math.round(((bs.inventory / is.costOfGoodsSold) * 365) * 10) / 10 : 0;
    const dpo = is.costOfGoodsSold > 0 ? Math.round(((bs.accountsPayable / is.costOfGoodsSold) * 365) * 10) / 10 : 0;
    const ccc = Math.round((dso + dio - dpo) * 10) / 10;

    // 4. Solvency
    const totalDebt = bs.shortTermDebt + bs.totalLongTermDebt;
    const debtToEquity = bs.totalEquity > 0 ? Math.round((totalDebt / bs.totalEquity) * 100) / 100 : 0;
    const interestCoverage = is.interestExpense > 0
      ? Math.round((operatingIncome / is.interestExpense) * 100) / 100
      : 999.0;

    return {
      period,
      liquidity: {
        currentRatio,
        quickRatio,
        cashRatio,
        workingCapitalUsd: workingCapital,
        isLiquidityHealthy,
      },
      profitability: {
        grossProfitMarginPercent: grossMargin,
        operatingProfitMarginPercent: operatingMargin,
        ebitdaMarginPercent: ebitdaMargin,
        netProfitMarginPercent: netMargin,
        returnOnEquityPercent: roe,
      },
      workingCapitalEfficiency: {
        daysSalesOutstandingDso: dso,
        daysInventoryOutstandingDio: dio,
        daysPayableOutstandingDpo: dpo,
        cashConversionCycleDays: ccc,
      },
      solvency: {
        debtToEquityRatio: debtToEquity,
        interestCoverageRatio: interestCoverage,
      },
    };
  }
}
