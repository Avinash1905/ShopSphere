import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { QueryBuilder } from '../queries/query_builder.js';
import {
  GLChartOfAccountTable,
  GLFiscalPeriodTable,
  GLJournalEntryTable,
  GLJournalEntryLineTable,
  GLAccountBalanceTable,
} from '../schema/general_ledger.schema.js';

export interface CreateJournalEntryLineInput {
  accountId: string;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  memo?: string;
  foreignCurrencyCode?: string;
  foreignAmount?: number;
  fxExchangeRate?: number;
}

export interface CreateJournalEntryInput {
  fiscalPeriodId: string;
  postingDate: string;
  documentType: GLJournalEntryTable['document_type'];
  referenceId?: string;
  memo: string;
  createdByUserId: string;
  lines: CreateJournalEntryLineInput[];
}

export interface PostingResult {
  journalEntry: GLJournalEntryTable;
  lines: GLJournalEntryLineTable[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export class GeneralLedgerRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Posts an atomic double-entry journal transaction ensuring Debits == Credits
   */
  public async postJournalEntry(input: CreateJournalEntryInput): Promise<PostingResult> {
    if (!input.lines || input.lines.length < 2) {
      throw new Error('A valid double-entry journal entry requires at least 2 lines (debit and credit).');
    }

    // 1. Verify fiscal period is open
    const periods = await this.db.query<GLFiscalPeriodTable>(
      'SELECT * FROM gl_fiscal_periods WHERE id = ? LIMIT 1',
      [input.fiscalPeriodId]
    );

    if (periods.length > 0 && periods[0].is_closed) {
      throw new Error(`Cannot post transaction: Fiscal period '${periods[0].period_name}' is locked/closed.`);
    }

    // 2. Validate zero-sum debit == credit balance
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      if (line.debitAmount < 0 || line.creditAmount < 0) {
        throw new Error('Debit and credit amounts must be non-negative.');
      }
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        throw new Error('A single journal line cannot contain both debit and credit amounts.');
      }
      totalDebit += line.debitAmount;
      totalCredit += line.creditAmount;
    }

    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(roundedDebit - roundedCredit) > 0.001) {
      throw new Error(
        `Journal entry is out of balance. Total Debits ($${roundedDebit.toFixed(2)}) != Total Credits ($${roundedCredit.toFixed(2)}).`
      );
    }

    const entryId = `je-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const entryNumber = `JE-${input.postingDate.substring(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const journalEntry: GLJournalEntryTable = {
      id: entryId,
      entry_number: entryNumber,
      fiscal_period_id: input.fiscalPeriodId,
      posting_date: input.postingDate,
      document_type: input.documentType,
      reference_id: input.referenceId,
      memo: input.memo,
      status: 'POSTED',
      total_debit: roundedDebit,
      total_credit: roundedCredit,
      created_by_user_id: input.createdByUserId,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO gl_journal_entries (
        id, entry_number, fiscal_period_id, posting_date, document_type,
        reference_id, memo, status, total_debit, total_credit,
        created_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        journalEntry.id,
        journalEntry.entry_number,
        journalEntry.fiscal_period_id,
        journalEntry.posting_date,
        journalEntry.document_type,
        journalEntry.reference_id || null,
        journalEntry.memo,
        journalEntry.status,
        journalEntry.total_debit,
        journalEntry.total_credit,
        journalEntry.created_by_user_id,
        journalEntry.created_at,
        journalEntry.updated_at,
      ]
    );

    const insertedLines: GLJournalEntryLineTable[] = [];

    for (let i = 0; i < input.lines.length; i++) {
      const lineInput = input.lines[i];
      const lineId = `line-${entryId}-${i + 1}`;
      const line: GLJournalEntryLineTable = {
        id: lineId,
        journal_entry_id: entryId,
        account_id: lineInput.accountId,
        account_code: lineInput.accountCode,
        line_number: i + 1,
        debit_amount: lineInput.debitAmount,
        credit_amount: lineInput.creditAmount,
        memo: lineInput.memo || input.memo,
        foreign_currency_code: lineInput.foreignCurrencyCode,
        foreign_amount: lineInput.foreignAmount,
        fx_exchange_rate: lineInput.fxExchangeRate,
        created_at: now,
      };

      await this.db.execute(
        `INSERT INTO gl_journal_entry_lines (
          id, journal_entry_id, account_id, account_code, line_number,
          debit_amount, credit_amount, memo, foreign_currency_code,
          foreign_amount, fx_exchange_rate, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          line.id,
          line.journal_entry_id,
          line.account_id,
          line.account_code,
          line.line_number,
          line.debit_amount,
          line.credit_amount,
          line.memo || null,
          line.foreign_currency_code || null,
          line.foreign_amount || null,
          line.fx_exchange_rate || null,
          line.created_at,
        ]
      );

      insertedLines.push(line);
    }

    return {
      journalEntry,
      lines: insertedLines,
      totalDebit: roundedDebit,
      totalCredit: roundedCredit,
      isBalanced: true,
    };
  }

  /**
   * Creates an opposing reversal entry for an existing posted transaction
   */
  public async reverseJournalEntry(
    originalEntryId: string,
    reversalUserId: string,
    reversalMemo?: string
  ): Promise<PostingResult> {
    const origEntries = await this.db.query<GLJournalEntryTable>(
      'SELECT * FROM gl_journal_entries WHERE id = ? LIMIT 1',
      [originalEntryId]
    );

    if (origEntries.length === 0) {
      throw new Error(`Journal entry '${originalEntryId}' not found.`);
    }

    const orig = origEntries[0];
    if (orig.status === 'REVERSED') {
      throw new Error(`Journal entry '${originalEntryId}' has already been reversed.`);
    }

    const origLines = await this.db.query<GLJournalEntryLineTable>(
      'SELECT * FROM gl_journal_entry_lines WHERE journal_entry_id = ? ORDER BY line_number ASC',
      [originalEntryId]
    );

    // Swap debits and credits for exact accounting reversal
    const reversalLines: CreateJournalEntryLineInput[] = origLines.map(line => ({
      accountId: line.account_id,
      accountCode: line.account_code,
      debitAmount: line.credit_amount, // Swap
      creditAmount: line.debit_amount, // Swap
      memo: `Reversal of line #${line.line_number} from ${orig.entry_number}`,
      foreignCurrencyCode: line.foreign_currency_code,
      foreignAmount: line.foreign_amount,
      fxExchangeRate: line.fx_exchange_rate,
    }));

    const reversalResult = await this.postJournalEntry({
      fiscalPeriodId: orig.fiscal_period_id,
      postingDate: new Date().toISOString().substring(0, 10),
      documentType: 'MANUAL_ADJUSTMENT',
      referenceId: orig.id,
      memo: reversalMemo || `Reversal of ${orig.entry_number}: ${orig.memo}`,
      createdByUserId: reversalUserId,
      lines: reversalLines,
    });

    // Mark original as REVERSED
    await this.db.execute(
      'UPDATE gl_journal_entries SET status = ?, reversal_entry_id = ?, updated_at = ? WHERE id = ?',
      ['REVERSED', reversalResult.journalEntry.id, new Date().toISOString(), originalEntryId]
    );

    return reversalResult;
  }
}
