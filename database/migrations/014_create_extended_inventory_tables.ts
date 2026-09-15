import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration014CreateExtendedInventoryTables: MigrationStep = {
  name: '014_create_extended_inventory_tables',
  version: '20260915000014',
  description: 'Create warehouses, zones, allocations, stock transfers, and alert rules tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(128) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        city VARCHAR(128) NOT NULL,
        state VARCHAR(128) NOT NULL,
        country VARCHAR(64) NOT NULL,
        postal_code VARCHAR(32) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS warehouse_zones (
        id VARCHAR(64) PRIMARY KEY,
        warehouse_id VARCHAR(64) NOT NULL,
        zone_name VARCHAR(64) NOT NULL,
        zone_type VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
        temperature_controlled BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory_allocations (
        id VARCHAR(64) PRIMARY KEY,
        inventory_id VARCHAR(64) NOT NULL,
        order_id VARCHAR(64) NOT NULL,
        allocated_quantity INTEGER NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'HELD',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        released_at TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory_transfers (
        id VARCHAR(64) PRIMARY KEY,
        source_warehouse_id VARCHAR(64) NOT NULL,
        destination_warehouse_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64),
        quantity INTEGER NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'INITIATED',
        tracking_number VARCHAR(128),
        dispatched_at TIMESTAMP,
        received_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
        FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS stock_alert_rules (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64),
        warehouse_id VARCHAR(64),
        reorder_point INTEGER NOT NULL DEFAULT 10,
        reorder_quantity INTEGER NOT NULL DEFAULT 50,
        safety_stock INTEGER NOT NULL DEFAULT 5,
        notify_email VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS stock_alert_rules;');
    await db.execute('DROP TABLE IF EXISTS inventory_transfers;');
    await db.execute('DROP TABLE IF EXISTS inventory_allocations;');
    await db.execute('DROP TABLE IF EXISTS warehouse_zones;');
    await db.execute('DROP TABLE IF EXISTS warehouses;');
  },
};
