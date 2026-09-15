import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration002CreateCatalogTables: MigrationStep = {
  name: '002_create_catalog_tables',
  version: '20260915000002',
  description: 'Create sellers, categories, brands, and products tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sellers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE,
        store_name VARCHAR(150) NOT NULL,
        store_slug VARCHAR(150) NOT NULL UNIQUE,
        business_name VARCHAR(255) NOT NULL,
        business_registration_number VARCHAR(64),
        tax_id VARCHAR(64),
        description TEXT,
        logo_url VARCHAR(512),
        banner_url VARCHAR(512),
        verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        verification_notes TEXT,
        verified_at TIMESTAMP,
        verified_by VARCHAR(36),
        commission_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        payout_bank_name VARCHAR(128),
        payout_account_number VARCHAR(64),
        payout_routing_number VARCHAR(64),
        payout_account_holder VARCHAR(150),
        rating_average DECIMAL(3,2) NOT NULL DEFAULT 0.00,
        total_reviews_count INTEGER NOT NULL DEFAULT 0,
        total_sales_count INTEGER NOT NULL DEFAULT 0,
        total_revenue_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        support_email VARCHAR(255) NOT NULL,
        support_phone VARCHAR(32),
        return_policy TEXT,
        shipping_policy TEXT,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        parent_id VARCHAR(36),
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        image_url VARCHAR(512),
        icon VARCHAR(64),
        depth_level INTEGER NOT NULL DEFAULT 0,
        hierarchy_path VARCHAR(512) NOT NULL DEFAULT '/',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        logo_url VARCHAR(512),
        website_url VARCHAR(512),
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        country_of_origin VARCHAR(64),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        seller_id VARCHAR(36) NOT NULL,
        category_id VARCHAR(36) NOT NULL,
        brand_id VARCHAR(36),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(280) NOT NULL UNIQUE,
        short_description VARCHAR(500),
        description TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
        tags TEXT NOT NULL DEFAULT '[]',
        attributes TEXT NOT NULL DEFAULT '{}',
        seo_title VARCHAR(150),
        seo_description VARCHAR(320),
        seo_keywords TEXT DEFAULT '[]',
        thumbnail_url VARCHAR(512),
        image_urls TEXT NOT NULL DEFAULT '[]',
        base_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        rating_average DECIMAL(3,2) NOT NULL DEFAULT 0.00,
        reviews_count INTEGER NOT NULL DEFAULT 0,
        total_sales_count INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        published_at TIMESTAMP,
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE RESTRICT,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS products;');
    await db.execute('DROP TABLE IF EXISTS brands;');
    await db.execute('DROP TABLE IF EXISTS categories;');
    await db.execute('DROP TABLE IF EXISTS sellers;');
  },
};
