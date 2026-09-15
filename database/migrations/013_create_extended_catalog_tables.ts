import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration013CreateExtendedCatalogTables: MigrationStep = {
  name: '013_create_extended_catalog_tables',
  version: '20260915000013',
  description: 'Create product attributes, values, media gallery, pricing tiers, closure table, bundles, and tags',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        code VARCHAR(64) NOT NULL UNIQUE,
        attribute_type VARCHAR(32) NOT NULL,
        is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
        is_searchable BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_attribute_values (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        attribute_id VARCHAR(64) NOT NULL,
        text_value TEXT,
        numeric_value DECIMAL(12, 4),
        boolean_value BOOLEAN,
        json_value JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_media_gallery (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64),
        media_type VARCHAR(32) NOT NULL,
        url VARCHAR(512) NOT NULL,
        thumbnail_url VARCHAR(512),
        alt_text VARCHAR(255),
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_pricing_tiers (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64),
        min_quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        customer_group VARCHAR(64) NOT NULL DEFAULT 'DEFAULT',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS category_closure_table (
        ancestor_id VARCHAR(64) NOT NULL,
        descendant_id VARCHAR(64) NOT NULL,
        depth INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ancestor_id, descendant_id),
        FOREIGN KEY (ancestor_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (descendant_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_bundles (
        id VARCHAR(64) PRIMARY KEY,
        parent_product_id VARCHAR(64) NOT NULL,
        child_product_id VARCHAR(64) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        discount_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (child_product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_tags (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        tag VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS product_tags;');
    await db.execute('DROP TABLE IF EXISTS product_bundles;');
    await db.execute('DROP TABLE IF EXISTS category_closure_table;');
    await db.execute('DROP TABLE IF EXISTS product_pricing_tiers;');
    await db.execute('DROP TABLE IF EXISTS product_media_gallery;');
    await db.execute('DROP TABLE IF EXISTS product_attribute_values;');
    await db.execute('DROP TABLE IF EXISTS product_attributes;');
  },
};
