import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration012CreateExtendedSellerTables: MigrationStep = {
  name: '012_create_extended_seller_tables',
  version: '20260915000012',
  description: 'Create seller KYC, payout accounts, commission tiers, badges, and vacation mode tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_kyc_verifications (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) NOT NULL,
        document_type VARCHAR(64) NOT NULL,
        document_number_hash VARCHAR(128) NOT NULL,
        document_url_encrypted TEXT NOT NULL,
        verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        rejection_reason TEXT,
        verified_by_user_id VARCHAR(64),
        verified_at TIMESTAMP,
        expires_at TIMESTAMP,
        metadata JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
        FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_payout_accounts (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) NOT NULL,
        account_type VARCHAR(32) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        routing_number_encrypted TEXT,
        account_number_last4 VARCHAR(4) NOT NULL,
        account_number_encrypted TEXT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_commission_tiers (
        id VARCHAR(64) PRIMARY KEY,
        tier_name VARCHAR(64) NOT NULL UNIQUE,
        min_monthly_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        max_monthly_volume DECIMAL(12, 2),
        commission_rate_percentage DECIMAL(5, 2) NOT NULL,
        flat_fee_per_order DECIMAL(6, 2) NOT NULL DEFAULT 0.30,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_badges (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) NOT NULL,
        badge_code VARCHAR(64) NOT NULL,
        badge_title VARCHAR(128) NOT NULL,
        awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_vacation_modes (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        pause_listings BOOLEAN NOT NULL DEFAULT TRUE,
        auto_response_message TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS seller_vacation_modes;');
    await db.execute('DROP TABLE IF EXISTS seller_badges;');
    await db.execute('DROP TABLE IF EXISTS seller_commission_tiers;');
    await db.execute('DROP TABLE IF EXISTS seller_payout_accounts;');
    await db.execute('DROP TABLE IF EXISTS seller_kyc_verifications;');
  },
};
