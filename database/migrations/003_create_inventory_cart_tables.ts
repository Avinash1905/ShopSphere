import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration003CreateInventoryCartTables: MigrationStep = {
  name: '003_create_inventory_cart_tables',
  version: '20260915000003',
  description: 'Create variants, inventory, carts, cart_items, wishlists, and wishlist_items tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS variants (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        sku VARCHAR(100) NOT NULL UNIQUE,
        barcode VARCHAR(64) UNIQUE,
        title VARCHAR(200) NOT NULL,
        option1_name VARCHAR(50),
        option1_value VARCHAR(100),
        option2_name VARCHAR(50),
        option2_value VARCHAR(100),
        option3_name VARCHAR(50),
        option3_value VARCHAR(100),
        price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        compare_at_price DECIMAL(12,2),
        cost_price DECIMAL(12,2),
        weight_grams INTEGER,
        dimensions_cm TEXT,
        image_url VARCHAR(512),
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(36) PRIMARY KEY,
        variant_id VARCHAR(36) NOT NULL UNIQUE,
        warehouse_location VARCHAR(100) NOT NULL DEFAULT 'MAIN_DC',
        quantity_on_hand INTEGER NOT NULL DEFAULT 0,
        quantity_reserved INTEGER NOT NULL DEFAULT 0,
        quantity_available INTEGER NOT NULL DEFAULT 0,
        safety_stock_threshold INTEGER NOT NULL DEFAULT 5,
        reorder_point INTEGER NOT NULL DEFAULT 10,
        reorder_quantity INTEGER NOT NULL DEFAULT 50,
        allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
        restock_expected_at TIMESTAMP,
        last_counted_at TIMESTAMP,
        version_lock INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        session_id VARCHAR(128),
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        total_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        coupon_id VARCHAR(36),
        expires_at TIMESTAMP,
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(36) PRIMARY KEY,
        cart_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        custom_attributes TEXT DEFAULT '{}',
        added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
        UNIQUE (cart_id, variant_id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL DEFAULT 'My Wishlist',
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        share_token VARCHAR(64) UNIQUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id VARCHAR(36) PRIMARY KEY,
        wishlist_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36),
        priority INTEGER NOT NULL DEFAULT 1,
        notes VARCHAR(255),
        added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
        UNIQUE (wishlist_id, product_id)
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS wishlist_items;');
    await db.execute('DROP TABLE IF EXISTS wishlists;');
    await db.execute('DROP TABLE IF EXISTS cart_items;');
    await db.execute('DROP TABLE IF EXISTS carts;');
    await db.execute('DROP TABLE IF EXISTS inventory;');
    await db.execute('DROP TABLE IF EXISTS variants;');
  },
};
