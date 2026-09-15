import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration016CreateExtendedPaymentTables: MigrationStep = {
  name: '016_create_extended_payment_tables',
  version: '20260915000016',
  description: 'Create payment transactions, payment methods, refunds, disputes, and seller settlements',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id VARCHAR(64) PRIMARY KEY,
        payment_id VARCHAR(64) NOT NULL,
        transaction_type VARCHAR(32) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        gateway_transaction_id VARCHAR(255) UNIQUE,
        gateway_response_code VARCHAR(64),
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        raw_response JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        method_type VARCHAR(32) NOT NULL,
        provider_token TEXT NOT NULL,
        card_brand VARCHAR(32),
        last4 VARCHAR(4),
        expiry_month INTEGER,
        expiry_year INTEGER,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_refunds (
        id VARCHAR(64) PRIMARY KEY,
        payment_id VARCHAR(64) NOT NULL,
        order_id VARCHAR(64) NOT NULL,
        refund_amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        reason TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        gateway_refund_id VARCHAR(255),
        processed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_disputes (
        id VARCHAR(64) PRIMARY KEY,
        payment_id VARCHAR(64) NOT NULL,
        gateway_dispute_id VARCHAR(255) UNIQUE,
        dispute_amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        dispute_reason VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'NEEDS_RESPONSE',
        evidence_due_date TIMESTAMP,
        evidence_data JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_settlements (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) NOT NULL,
        settlement_period_start TIMESTAMP NOT NULL,
        settlement_period_end TIMESTAMP NOT NULL,
        gross_sales_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        marketplace_commission_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        refund_deductions_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        adjustments_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        net_payout_amount DECIMAL(14, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        payout_account_id VARCHAR(64),
        transferred_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS seller_settlements;');
    await db.execute('DROP TABLE IF EXISTS payment_disputes;');
    await db.execute('DROP TABLE IF EXISTS payment_refunds;');
    await db.execute('DROP TABLE IF EXISTS payment_methods;');
    await db.execute('DROP TABLE IF EXISTS payment_transactions;');
  },
};
