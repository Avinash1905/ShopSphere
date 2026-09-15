import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration023CreateB2BWholesaleTables: MigrationStep = {
  name: '023_create_b2b_wholesale_tables',
  version: '20260915000023',
  description: 'Create B2B company accounts, tiered pricing matrix, RFQ requests, and corporate invoices',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    // 1. b2b_company_accounts
    await db.execute(`
      CREATE TABLE IF NOT EXISTS b2b_company_accounts (
        id VARCHAR(36) PRIMARY KEY,
        company_name VARCHAR(128) NOT NULL,
        registration_number VARCHAR(64) NOT NULL UNIQUE,
        credit_limit_usd DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        available_credit_usd DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        payment_terms VARCHAR(32) NOT NULL DEFAULT 'PREPAID',
        account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        tax_exemption_certificate_id VARCHAR(64),
        is_tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
        primary_contact_email VARCHAR(128) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. b2b_tiered_pricing_matrix
    await db.execute(`
      CREATE TABLE IF NOT EXISTS b2b_tiered_pricing_matrix (
        id VARCHAR(36) PRIMARY KEY,
        variant_id VARCHAR(36) NOT NULL,
        min_quantity INT NOT NULL DEFAULT 1,
        max_quantity INT,
        discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        fixed_unit_price_usd DECIMAL(10, 2),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. b2b_quote_rfq_requests
    await db.execute(`
      CREATE TABLE IF NOT EXISTS b2b_quote_rfq_requests (
        id VARCHAR(36) PRIMARY KEY,
        rfq_number VARCHAR(64) NOT NULL UNIQUE,
        company_id VARCHAR(36) NOT NULL,
        seller_id VARCHAR(36) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
        requested_total_usd DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        quoted_total_usd DECIMAL(14, 2),
        converted_order_id VARCHAR(36),
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. b2b_quote_rfq_items
    await db.execute(`
      CREATE TABLE IF NOT EXISTS b2b_quote_rfq_items (
        id VARCHAR(36) PRIMARY KEY,
        rfq_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NOT NULL,
        sku VARCHAR(64) NOT NULL,
        quantity_requested INT NOT NULL DEFAULT 1,
        target_unit_price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        quoted_unit_price_usd DECIMAL(10, 2),
        notes VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. b2b_corporate_invoices
    await db.execute(`
      CREATE TABLE IF NOT EXISTS b2b_corporate_invoices (
        id VARCHAR(36) PRIMARY KEY,
        invoice_number VARCHAR(64) NOT NULL UNIQUE,
        company_id VARCHAR(36) NOT NULL,
        order_id VARCHAR(36) NOT NULL,
        invoice_amount_usd DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        paid_amount_usd DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        due_date DATE NOT NULL,
        payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
        dunning_stage INT NOT NULL DEFAULT 0,
        issued_at DATETIME NOT NULL,
        paid_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS b2b_corporate_invoices');
    await db.execute('DROP TABLE IF EXISTS b2b_quote_rfq_items');
    await db.execute('DROP TABLE IF EXISTS b2b_quote_rfq_requests');
    await db.execute('DROP TABLE IF EXISTS b2b_tiered_pricing_matrix');
    await db.execute('DROP TABLE IF EXISTS b2b_company_accounts');
  },
};
