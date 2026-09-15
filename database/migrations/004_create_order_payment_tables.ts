import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration004CreateOrderPaymentTables: MigrationStep = {
  name: '004_create_order_payment_tables',
  version: '20260915000004',
  description: 'Create orders, order_items, payments, coupons, and coupon_usages tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        discount_type VARCHAR(32) NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        max_discount_amount DECIMAL(12,2),
        usage_limit_total INTEGER,
        usage_limit_per_user INTEGER NOT NULL DEFAULT 1,
        times_used INTEGER NOT NULL DEFAULT 0,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        applicable_category_ids TEXT DEFAULT '[]',
        applicable_product_ids TEXT DEFAULT '[]',
        applicable_seller_ids TEXT DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        order_number VARCHAR(64) NOT NULL UNIQUE,
        user_id VARCHAR(36) NOT NULL,
        seller_id VARCHAR(36),
        order_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
        shipping_status VARCHAR(32) NOT NULL DEFAULT 'UNFULFILLED',
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        subtotal_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        shipping_fee DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        grand_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        coupon_id VARCHAR(36),
        shipping_address_id VARCHAR(36) NOT NULL,
        billing_address_id VARCHAR(36) NOT NULL,
        tracking_number VARCHAR(128),
        shipping_carrier VARCHAR(64),
        estimated_delivery_at TIMESTAMP,
        actual_delivery_at TIMESTAMP,
        customer_notes TEXT,
        internal_notes TEXT,
        ip_address VARCHAR(45),
        user_agent VARCHAR(512),
        cancelled_at TIMESTAMP,
        cancellation_reason VARCHAR(255),
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NOT NULL,
        seller_id VARCHAR(36) NOT NULL,
        product_title VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        item_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE RESTRICT,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE RESTRICT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        payment_reference VARCHAR(100) NOT NULL UNIQUE,
        payment_method VARCHAR(32) NOT NULL,
        payment_gateway VARCHAR(64) NOT NULL,
        gateway_transaction_id VARCHAR(128),
        amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        error_code VARCHAR(64),
        error_message TEXT,
        refunded_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        refund_reason VARCHAR(255),
        idempotency_key VARCHAR(128) UNIQUE,
        metadata TEXT DEFAULT '{}',
        processed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id VARCHAR(36) PRIMARY KEY,
        coupon_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        order_id VARCHAR(36) NOT NULL UNIQUE,
        discount_applied DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS coupon_usages;');
    await db.execute('DROP TABLE IF EXISTS payments;');
    await db.execute('DROP TABLE IF EXISTS order_items;');
    await db.execute('DROP TABLE IF EXISTS orders;');
    await db.execute('DROP TABLE IF EXISTS coupons;');
  },
};
