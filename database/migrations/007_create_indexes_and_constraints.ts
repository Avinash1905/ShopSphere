import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration007CreateIndexesAndConstraints: MigrationStep = {
  name: '007_create_indexes_and_constraints',
  version: '20260915000007',
  description: 'Create performance indexes, multi-column search indexes, and relational query accelerators',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    // User indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_users_status_created ON users (status, created_at);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_users_lockout ON users (lockout_until);');

    // Role & Permission indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_roles_priority ON roles (priority);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions (module, action);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_role_permissions_perm_role ON role_permissions (permission_id, role_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_user_roles_role_user ON user_roles (role_id, user_id);');

    // Catalog indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_sellers_verification_status ON sellers (verification_status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_sellers_rating_featured ON sellers (rating_average, is_featured);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_categories_parent_order ON categories (parent_id, display_order);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_categories_path ON categories (hierarchy_path);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_brands_active_verified ON brands (is_active, is_verified);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products (seller_id, status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_products_category_status ON products (category_id, status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_products_brand_status ON products (brand_id, status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_products_price_rating ON products (base_price, rating_average);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_products_search_composite ON products (status, is_featured, rating_average, total_sales_count);');

    // Variant & Inventory indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants (product_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_variants_barcode ON variants (barcode);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory (quantity_available, allow_backorder);');

    // Cart & Wishlist indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_carts_user_status ON carts (user_id, status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_carts_session_status ON carts (session_id, status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists (user_id);');

    // Order & Payment indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (order_status, created_at);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders (seller_id, order_status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_order_items_seller_status ON order_items (seller_id, item_status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items (variant_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments (status, created_at);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON coupon_usages (coupon_id, user_id);');

    // Review & Engagement indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews (product_id, rating, status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews (created_at);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_addresses_defaults ON addresses (user_id, is_default_shipping, is_default_billing);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read, created_at);');

    // Audit log indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_entity_lookup ON audit_logs (entity_name, entity_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON audit_logs (actor_id, created_at);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_action_created ON audit_logs (action, created_at);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_severity_created ON audit_logs (severity, created_at);');
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP INDEX IF EXISTS idx_audit_severity_created;');
    await db.execute('DROP INDEX IF EXISTS idx_audit_action_created;');
    await db.execute('DROP INDEX IF EXISTS idx_audit_actor_created;');
    await db.execute('DROP INDEX IF EXISTS idx_audit_entity_lookup;');
    await db.execute('DROP INDEX IF EXISTS idx_notifications_user_read;');
    await db.execute('DROP INDEX IF EXISTS idx_addresses_defaults;');
    await db.execute('DROP INDEX IF EXISTS idx_addresses_user_id;');
    await db.execute('DROP INDEX IF EXISTS idx_reviews_created;');
    await db.execute('DROP INDEX IF EXISTS idx_reviews_product_rating;');
    await db.execute('DROP INDEX IF EXISTS idx_coupon_usages_coupon_user;');
    await db.execute('DROP INDEX IF EXISTS idx_payments_status_created;');
    await db.execute('DROP INDEX IF EXISTS idx_payments_order_id;');
    await db.execute('DROP INDEX IF EXISTS idx_order_items_variant_id;');
    await db.execute('DROP INDEX IF EXISTS idx_order_items_seller_status;');
    await db.execute('DROP INDEX IF EXISTS idx_order_items_order_id;');
    await db.execute('DROP INDEX IF EXISTS idx_orders_seller_status;');
    await db.execute('DROP INDEX IF EXISTS idx_orders_status_created;');
    await db.execute('DROP INDEX IF EXISTS idx_orders_user_created;');
    await db.execute('DROP INDEX IF EXISTS idx_wishlists_user_id;');
    await db.execute('DROP INDEX IF EXISTS idx_carts_session_status;');
    await db.execute('DROP INDEX IF EXISTS idx_carts_user_status;');
    await db.execute('DROP INDEX IF EXISTS idx_inventory_available;');
    await db.execute('DROP INDEX IF EXISTS idx_variants_barcode;');
    await db.execute('DROP INDEX IF EXISTS idx_variants_product_id;');
    await db.execute('DROP INDEX IF EXISTS idx_products_search_composite;');
    await db.execute('DROP INDEX IF EXISTS idx_products_price_rating;');
    await db.execute('DROP INDEX IF EXISTS idx_products_brand_status;');
    await db.execute('DROP INDEX IF EXISTS idx_products_category_status;');
    await db.execute('DROP INDEX IF EXISTS idx_products_seller_status;');
    await db.execute('DROP INDEX IF EXISTS idx_brands_active_verified;');
    await db.execute('DROP INDEX IF EXISTS idx_categories_path;');
    await db.execute('DROP INDEX IF EXISTS idx_categories_parent_order;');
    await db.execute('DROP INDEX IF EXISTS idx_sellers_rating_featured;');
    await db.execute('DROP INDEX IF EXISTS idx_sellers_verification_status;');
    await db.execute('DROP INDEX IF EXISTS idx_user_roles_role_user;');
    await db.execute('DROP INDEX IF EXISTS idx_role_permissions_perm_role;');
    await db.execute('DROP INDEX IF EXISTS idx_permissions_module_action;');
    await db.execute('DROP INDEX IF EXISTS idx_roles_priority;');
    await db.execute('DROP INDEX IF EXISTS idx_users_lockout;');
    await db.execute('DROP INDEX IF EXISTS idx_users_status_created;');
  },
};
