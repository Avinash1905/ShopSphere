import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration022CreateGeneralLedgerTables: MigrationStep = {
  name: '022_create_general_ledger_tables',
  version: '20260915000022',
  description: 'Create Chart of Accounts, Fiscal Periods, Journal Entries, Lines, Balances, and 1099-K Tax tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    // 1. gl_chart_of_accounts
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gl_chart_of_accounts (
        id VARCHAR(36) PRIMARY KEY,
        account_code VARCHAR(32) NOT NULL UNIQUE,
        account_name VARCHAR(128) NOT NULL,
        account_category VARCHAR(32) NOT NULL,
        account_subtype VARCHAR(64) NOT NULL,
        normal_balance VARCHAR(16) NOT NULL,
        currency_code VARCHAR(8) NOT NULL DEFAULT 'USD',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        parent_account_id VARCHAR(36),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. gl_fiscal_periods
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gl_fiscal_periods (
        id VARCHAR(36) PRIMARY KEY,
        fiscal_year INT NOT NULL,
        period_number INT NOT NULL,
        period_name VARCHAR(32) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_closed BOOLEAN NOT NULL DEFAULT FALSE,
        closed_at DATETIME,
        closed_by_user_id VARCHAR(36),
        cryptographic_seal_hash VARCHAR(128),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. gl_journal_entries
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gl_journal_entries (
        id VARCHAR(36) PRIMARY KEY,
        entry_number VARCHAR(64) NOT NULL UNIQUE,
        fiscal_period_id VARCHAR(36) NOT NULL,
        posting_date DATE NOT NULL,
        document_type VARCHAR(32) NOT NULL,
        reference_id VARCHAR(64),
        memo TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'POSTED',
        total_debit DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        total_credit DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        created_by_user_id VARCHAR(36) NOT NULL,
        approved_by_user_id VARCHAR(36),
        reversal_entry_id VARCHAR(36),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. gl_journal_entry_lines
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gl_journal_entry_lines (
        id VARCHAR(36) PRIMARY KEY,
        journal_entry_id VARCHAR(36) NOT NULL,
        account_id VARCHAR(36) NOT NULL,
        account_code VARCHAR(32) NOT NULL,
        line_number INT NOT NULL,
        debit_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        credit_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        memo VARCHAR(255),
        foreign_currency_code VARCHAR(8),
        foreign_amount DECIMAL(14, 2),
        fx_exchange_rate DECIMAL(10, 6),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. gl_account_balances
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gl_account_balances (
        id VARCHAR(36) PRIMARY KEY,
        account_id VARCHAR(36) NOT NULL,
        fiscal_period_id VARCHAR(36) NOT NULL,
        beginning_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        total_debit DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        total_credit DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        ending_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. seller_tax_form_1099k
    await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_tax_form_1099k (
        id VARCHAR(36) PRIMARY KEY,
        seller_id VARCHAR(36) NOT NULL,
        tax_year INT NOT NULL,
        gross_payment_amount_usd DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        transaction_count INT NOT NULL DEFAULT 0,
        monthly_breakdown_json TEXT NOT NULL,
        ein_tin_last4 VARCHAR(8) NOT NULL,
        legal_business_name VARCHAR(128) NOT NULL,
        is_w9_verified BOOLEAN NOT NULL DEFAULT FALSE,
        filing_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_GENERATION',
        generated_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS seller_tax_form_1099k');
    await db.execute('DROP TABLE IF EXISTS gl_account_balances');
    await db.execute('DROP TABLE IF EXISTS gl_journal_entry_lines');
    await db.execute('DROP TABLE IF EXISTS gl_journal_entries');
    await db.execute('DROP TABLE IF EXISTS gl_fiscal_periods');
    await db.execute('DROP TABLE IF EXISTS gl_chart_of_accounts');
  },
};
