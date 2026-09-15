import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration017CreateExtendedEngagementTables: MigrationStep = {
  name: '017_create_extended_engagement_tables',
  version: '20260915000017',
  description: 'Create review media, helpful votes, seller responses, cart abandonment, and saved-for-later tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS review_media (
        id VARCHAR(64) PRIMARY KEY,
        review_id VARCHAR(64) NOT NULL,
        media_type VARCHAR(32) NOT NULL,
        url VARCHAR(512) NOT NULL,
        thumbnail_url VARCHAR(512),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS review_helpful_votes (
        id VARCHAR(64) PRIMARY KEY,
        review_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        is_helpful BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS review_seller_responses (
        id VARCHAR(64) PRIMARY KEY,
        review_id VARCHAR(64) NOT NULL UNIQUE,
        seller_id VARCHAR(64) NOT NULL,
        response_text TEXT NOT NULL,
        is_approved BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS cart_abandonment_logs (
        id VARCHAR(64) PRIMARY KEY,
        cart_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64),
        cart_total_value DECIMAL(12, 2) NOT NULL,
        item_count INTEGER NOT NULL,
        abandoned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        recovery_email_sent_at TIMESTAMP,
        is_recovered BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS saved_for_later_items (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS saved_for_later_items;');
    await db.execute('DROP TABLE IF EXISTS cart_abandonment_logs;');
    await db.execute('DROP TABLE IF EXISTS review_seller_responses;');
    await db.execute('DROP TABLE IF EXISTS review_helpful_votes;');
    await db.execute('DROP TABLE IF EXISTS review_media;');
  },
};
