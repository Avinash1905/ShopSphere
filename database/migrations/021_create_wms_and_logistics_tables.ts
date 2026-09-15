import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration021CreateWmsAndLogisticsTables: MigrationStep = {
  name: '021_create_wms_and_logistics_tables',
  version: '20260915000021',
  description: 'Create WMS zones, bins, allocations, ASNs, stock transfers, and cycle counts',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    // 1. warehouse_zones
    await db.execute(`
      CREATE TABLE IF NOT EXISTS warehouse_zones (
        id VARCHAR(36) PRIMARY KEY,
        warehouse_id VARCHAR(36) NOT NULL,
        zone_code VARCHAR(32) NOT NULL,
        zone_name VARCHAR(100) NOT NULL,
        zone_type VARCHAR(32) NOT NULL DEFAULT 'AMBIENT',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. warehouse_bins
    await db.execute(`
      CREATE TABLE IF NOT EXISTS warehouse_bins (
        id VARCHAR(36) PRIMARY KEY,
        warehouse_id VARCHAR(36) NOT NULL,
        zone_id VARCHAR(36) NOT NULL,
        aisle VARCHAR(16) NOT NULL,
        rack VARCHAR(16) NOT NULL,
        shelf VARCHAR(16) NOT NULL,
        bin_code VARCHAR(64) NOT NULL,
        max_weight_kg DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
        max_volume_cubic_meters DECIMAL(10, 3) NOT NULL DEFAULT 2.500,
        current_weight_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        current_volume_cubic_meters DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
        is_locked_for_count BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. inventory_bin_allocations
    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory_bin_allocations (
        id VARCHAR(36) PRIMARY KEY,
        bin_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NOT NULL,
        quantity_on_hand INT NOT NULL DEFAULT 0,
        quantity_reserved INT NOT NULL DEFAULT 0,
        lot_number VARCHAR(64),
        expiration_date DATE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. asn_inbound_shipments
    await db.execute(`
      CREATE TABLE IF NOT EXISTS asn_inbound_shipments (
        id VARCHAR(36) PRIMARY KEY,
        asn_number VARCHAR(64) NOT NULL UNIQUE,
        warehouse_id VARCHAR(36) NOT NULL,
        supplier_id VARCHAR(36) NOT NULL,
        carrier_code VARCHAR(32),
        tracking_number VARCHAR(64),
        status VARCHAR(32) NOT NULL DEFAULT 'EXPECTED',
        total_units_expected INT NOT NULL DEFAULT 0,
        total_units_received INT NOT NULL DEFAULT 0,
        total_units_damaged INT NOT NULL DEFAULT 0,
        expected_arrival_date DATE,
        received_date DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. asn_inbound_items
    await db.execute(`
      CREATE TABLE IF NOT EXISTS asn_inbound_items (
        id VARCHAR(36) PRIMARY KEY,
        asn_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NOT NULL,
        sku VARCHAR(64) NOT NULL,
        quantity_expected INT NOT NULL DEFAULT 0,
        quantity_received INT NOT NULL DEFAULT 0,
        quantity_damaged INT NOT NULL DEFAULT 0,
        destination_bin_id VARCHAR(36),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. stock_transfer_orders
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stock_transfer_orders (
        id VARCHAR(36) PRIMARY KEY,
        transfer_number VARCHAR(64) NOT NULL UNIQUE,
        source_warehouse_id VARCHAR(36) NOT NULL,
        destination_warehouse_id VARCHAR(36) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
        carrier_code VARCHAR(32),
        tracking_number VARCHAR(64),
        shipped_at DATETIME,
        received_at DATETIME,
        total_units INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. inventory_cycle_counts
    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory_cycle_counts (
        id VARCHAR(36) PRIMARY KEY,
        count_batch_number VARCHAR(64) NOT NULL,
        warehouse_id VARCHAR(36) NOT NULL,
        bin_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NOT NULL,
        system_quantity INT NOT NULL DEFAULT 0,
        counted_quantity INT NOT NULL DEFAULT 0,
        variance_quantity INT NOT NULL DEFAULT 0,
        variance_value_usd DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        auditor_user_id VARCHAR(36) NOT NULL,
        is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
        reconciled_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS inventory_cycle_counts');
    await db.execute('DROP TABLE IF EXISTS stock_transfer_orders');
    await db.execute('DROP TABLE IF EXISTS asn_inbound_items');
    await db.execute('DROP TABLE IF EXISTS asn_inbound_shipments');
    await db.execute('DROP TABLE IF EXISTS inventory_bin_allocations');
    await db.execute('DROP TABLE IF EXISTS warehouse_bins');
    await db.execute('DROP TABLE IF EXISTS warehouse_zones');
  },
};
