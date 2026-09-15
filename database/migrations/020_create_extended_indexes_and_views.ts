import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration020CreateExtendedIndexesAndViews: MigrationStep = {
  name: '020_create_extended_indexes_and_views',
  version: '20260915000020',
  description: 'Create composite indexes, analytical performance views, and summary views for extended entities',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    // 1. Extended Composite Indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_mfa_user_active ON user_mfa_devices (user_id, is_active);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_kyc_seller_status ON seller_kyc_verifications (seller_id, verification_status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_prod_attr_val_unique ON product_attribute_values (product_id, attribute_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_inv_alloc_order ON inventory_allocations (order_id, status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_fulf_order_status ON order_fulfillments (order_id, fulfillment_status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_pay_trans_payment ON payment_transactions (payment_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_sec_event_actor ON security_events_ledger (actor_user_id, event_type);');

    // 2. Analytical & Summary Database Views
    await db.execute(`
      CREATE VIEW IF NOT EXISTS view_seller_fulfillment_performance AS
      SELECT
        s.id AS seller_id,
        s.store_name,
        COUNT(f.id) AS total_fulfillments,
        COUNT(CASE WHEN f.fulfillment_status = 'DELIVERED' THEN 1 END) AS delivered_count,
        COUNT(CASE WHEN f.fulfillment_status = 'RETURNED' THEN 1 END) AS returned_count
      FROM sellers s
      LEFT JOIN products p ON s.id = p.seller_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN order_fulfillments f ON oi.order_id = f.order_id
      GROUP BY s.id, s.store_name;
    `);

    await db.execute(`
      CREATE VIEW IF NOT EXISTS view_inventory_warehouse_utilization AS
      SELECT
        w.id AS warehouse_id,
        w.code AS warehouse_code,
        w.name AS warehouse_name,
        COUNT(i.id) AS total_skus,
        COALESCE(SUM(i.quantity), 0) AS total_units_in_stock,
        COALESCE(SUM(a.allocated_quantity), 0) AS total_units_allocated
      FROM warehouses w
      LEFT JOIN inventory i ON 1=1
      LEFT JOIN inventory_allocations a ON i.id = a.inventory_id AND a.status = 'HELD'
      GROUP BY w.id, w.code, w.name;
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP VIEW IF EXISTS view_inventory_warehouse_utilization;');
    await db.execute('DROP VIEW IF EXISTS view_seller_fulfillment_performance;');
    await db.execute('DROP INDEX IF EXISTS idx_sec_event_actor;');
    await db.execute('DROP INDEX IF EXISTS idx_pay_trans_payment;');
    await db.execute('DROP INDEX IF EXISTS idx_fulf_order_status;');
    await db.execute('DROP INDEX IF EXISTS idx_inv_alloc_order;');
    await db.execute('DROP INDEX IF EXISTS idx_prod_attr_val_unique;');
    await db.execute('DROP INDEX IF EXISTS idx_kyc_seller_status;');
    await db.execute('DROP INDEX IF EXISTS idx_mfa_user_active;');
  },
};
