import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { GLJournalEntryLineTable } from '../schema/general_ledger.schema.js';

export interface FXPositionHoldings {
  currencyCode: string;
  foreignAmount: number;
  originalBookedValueUsd: number;
  historicalWeightedRate: number;
  closingSpotRate: number;
  currentRevaluedUsd: number;
  unrealizedGainLossUsd: number;
  gainLossType: 'GAIN' | 'LOSS' | 'NEUTRAL';
}

export interface FXRevaluationSummary {
  revaluationDate: string;
  baseCurrency: string;
  totalPositionsRevalued: number;
  netUnrealizedGainLossUsd: number;
  overallImpact: 'NET_GAIN' | 'NET_LOSS' | 'BALANCED';
  currencyBreakdown: FXPositionHoldings[];
}

export class FXRevaluationQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Evaluates unrealized foreign currency exchange gain/loss against month-end spot rates
   */
  public async computePeriodEndFXRevaluation(
    asOfDate: string,
    closingSpotRates: Record<string, number> = { EUR: 1.08, GBP: 1.28, JPY: 0.0068, CAD: 0.74, AUD: 0.66 }
  ): Promise<FXRevaluationSummary> {
    const lines = await this.db.query<GLJournalEntryLineTable>(
      'SELECT * FROM gl_journal_entry_lines WHERE foreign_currency_code IS NOT NULL'
    );

    // Group by foreign currency
    const currencyTotals: Record<string, { foreignAmount: number; bookedUsd: number }> = {};

    for (const line of lines) {
      const code = line.foreign_currency_code!;
      if (!currencyTotals[code]) {
        currencyTotals[code] = { foreignAmount: 0, bookedUsd: 0 };
      }

      const isDebit = line.debit_amount > 0;
      const fAmount = isDebit ? (line.foreign_amount || 0) : -(line.foreign_amount || 0);
      const usdAmount = isDebit ? line.debit_amount : -line.credit_amount;

      currencyTotals[code].foreignAmount += fAmount;
      currencyTotals[code].bookedUsd += usdAmount;
    }

    const breakdown: FXPositionHoldings[] = [];
    let netGainLoss = 0;

    for (const [code, pos] of Object.entries(currencyTotals)) {
      if (Math.abs(pos.foreignAmount) < 0.01) continue;

      const spotRate = closingSpotRates[code] || 1.0;
      const revaluedUsd = Math.round(pos.foreignAmount * spotRate * 100) / 100;
      const roundedBooked = Math.round(pos.bookedUsd * 100) / 100;
      const variance = Math.round((revaluedUsd - roundedBooked) * 100) / 100;
      const histRate = pos.foreignAmount !== 0 ? Math.round((pos.bookedUsd / pos.foreignAmount) * 10000) / 10000 : spotRate;

      netGainLoss += variance;

      breakdown.push({
        currencyCode: code,
        foreignAmount: Math.round(pos.foreignAmount * 100) / 100,
        originalBookedValueUsd: roundedBooked,
        historicalWeightedRate: histRate,
        closingSpotRate: spotRate,
        currentRevaluedUsd: revaluedUsd,
        unrealizedGainLossUsd: variance,
        gainLossType: variance > 0 ? 'GAIN' : variance < 0 ? 'LOSS' : 'NEUTRAL',
      });
    }

    const roundedNet = Math.round(netGainLoss * 100) / 100;

    return {
      revaluationDate: asOfDate,
      baseCurrency: 'USD',
      totalPositionsRevalued: breakdown.length,
      netUnrealizedGainLossUsd: roundedNet,
      overallImpact: roundedNet > 0 ? 'NET_GAIN' : roundedNet < 0 ? 'NET_LOSS' : 'BALANCED',
      currencyBreakdown: breakdown,
    };
  }
}
