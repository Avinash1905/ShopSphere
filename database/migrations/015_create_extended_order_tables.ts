import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration015CreateExtendedOrderTables: MigrationStep = {
  name: '015_create_extended_order_tables',
  version: '20260915000015',
  description: 'Create order fulfillments, shipment packages, tracking events, status history, and cancellations',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_fulfillments (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        warehouse_id VARCHAR(64) NOT NULL,
        fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'UNFULFILLED',
        carrier_name VARCHAR(64),
        service_tier VARCHAR(64),
        tracking_number VARCHAR(128),
        shipped_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_shipment_packages (
        id VARCHAR(64) PRIMARY KEY,
        fulfillment_id VARCHAR(64) NOT NULL,
        package_type VARCHAR(32) NOT NULL DEFAULT 'BOX',
        weight_kg DECIMAL(8, 3) NOT NULL,
        length_cm DECIMAL(8, 2) NOT NULL,
        width_cm DECIMAL(8, 2) NOT NULL,
        height_cm DECIMAL(8, 2) NOT NULL,
        shipping_label_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fulfillment_id) REFERENCES order_fulfillments(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_tracking_events (
        id VARCHAR(64) PRIMARY KEY,
        fulfillment_id VARCHAR(64) NOT NULL,
        event_status VARCHAR(64) NOT NULL,
        event_location VARCHAR(255),
        event_description TEXT NOT NULL,
        event_timestamp TIMESTAMP NOT NULL,
        raw_payload JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fulfillment_id) REFERENCES order_fulfillments(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        previous_status VARCHAR(32),
        new_status VARCHAR(32) NOT NULL,
        reason TEXT,
        changed_by_user_id VARCHAR(64),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_cancellations (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL UNIQUE,
        cancelled_by_type VARCHAR(32) NOT NULL,
        cancellation_code VARCHAR(64) NOT NULL,
        notes TEXT,
        refund_requested BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS order_cancellations;');
    await db.execute('DROP TABLE IF EXISTS order_status_history;');
    await db.execute('DROP TABLE IF EXISTS order_tracking_events;');
    await db.execute('DROP TABLE IF EXISTS order_shipment_packages;');
    await db.execute('DROP TABLE IF EXISTS order_fulfillments;');
  },
};
