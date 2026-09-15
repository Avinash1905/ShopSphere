import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration005CreateEngagementTables: MigrationStep = {
  name: '005_create_engagement_tables',
  version: '20260915000005',
  description: 'Create reviews, review_votes, addresses, and notifications tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        address_type VARCHAR(32) NOT NULL DEFAULT 'SHIPPING',
        recipient_name VARCHAR(150) NOT NULL,
        company_name VARCHAR(150),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state_province VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country_code VARCHAR(2) NOT NULL,
        phone_number VARCHAR(32) NOT NULL,
        is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
        is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
        delivery_instructions TEXT,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        order_item_id VARCHAR(36),
        rating INTEGER NOT NULL,
        title VARCHAR(150) NOT NULL,
        comment TEXT NOT NULL,
        is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
        helpful_votes_count INTEGER NOT NULL DEFAULT 0,
        unhelpful_votes_count INTEGER NOT NULL DEFAULT 0,
        image_urls TEXT DEFAULT '[]',
        seller_reply TEXT,
        seller_replied_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
        UNIQUE (user_id, product_id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS review_votes (
        id VARCHAR(36) PRIMARY KEY,
        review_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        is_helpful BOOLEAN NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (review_id, user_id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(32) NOT NULL DEFAULT 'SYSTEM',
        delivery_channel VARCHAR(32) NOT NULL DEFAULT 'IN_APP',
        priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMP,
        action_url VARCHAR(512),
        metadata TEXT DEFAULT '{}',
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS notifications;');
    await db.execute('DROP TABLE IF EXISTS review_votes;');
    await db.execute('DROP TABLE IF EXISTS reviews;');
    await db.execute('DROP TABLE IF EXISTS addresses;');
  },
};
