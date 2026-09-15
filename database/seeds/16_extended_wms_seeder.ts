import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedWMSSeeder: Seeder = {
  name: 'ExtendedWMSSeeder',
  order: 16,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let count = 0;

    // 1. Warehouse Zones for Primary Warehouse
    const zones = [
      { id: 'zone-oak-ambient', wh: 'wh-oakland-dc', code: 'ZONE-A', name: 'Ambient Standard Storage', type: 'AMBIENT' },
      { id: 'zone-oak-cold', wh: 'wh-oakland-dc', code: 'ZONE-C', name: 'Cold Refrigeration Vault', type: 'REFRIGERATED' },
      { id: 'zone-oak-highval', wh: 'wh-oakland-dc', code: 'ZONE-V', name: 'High Value Security Vault', type: 'HIGH_VALUE_VAULT' },
    ];

    for (const z of zones) {
      await db.execute(
        `INSERT INTO warehouse_zones (id, warehouse_id, zone_code, zone_name, zone_type, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [z.id, z.wh, z.code, z.name, z.type]
      );
      count++;
    }

    // 2. Warehouse Bins
    const bins = [
      { id: 'bin-oak-a01-r01-s01', wh: 'wh-oakland-dc', zone: 'zone-oak-ambient', aisle: 'A01', rack: 'R01', shelf: 'S01', code: 'A01-R01-S01' },
      { id: 'bin-oak-a01-r01-s02', wh: 'wh-oakland-dc', zone: 'zone-oak-ambient', aisle: 'A01', rack: 'R01', shelf: 'S02', code: 'A01-R01-S02' },
      { id: 'bin-oak-a02-r01-s01', wh: 'wh-oakland-dc', zone: 'zone-oak-ambient', aisle: 'A02', rack: 'R01', shelf: 'S01', code: 'A02-R01-S01' },
      { id: 'bin-oak-c01-r01-s01', wh: 'wh-oakland-dc', zone: 'zone-oak-cold', aisle: 'C01', rack: 'R01', shelf: 'S01', code: 'C01-R01-S01' },
      { id: 'bin-oak-v01-r01-s01', wh: 'wh-oakland-dc', zone: 'zone-oak-highval', aisle: 'V01', rack: 'R01', shelf: 'S01', code: 'V01-R01-S01' },
    ];

    for (const b of bins) {
      await db.execute(
        `INSERT INTO warehouse_bins (
          id, warehouse_id, zone_id, aisle, rack, shelf, bin_code,
          max_weight_kg, max_volume_cubic_meters, current_weight_kg, current_volume_cubic_meters, is_locked_for_count, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 500.00, 2.500, 45.00, 0.450, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [b.id, b.wh, b.zone, b.aisle, b.rack, b.shelf, b.code]
      );
      count++;
    }

    // 3. Bin Inventory Allocations
    const allocations = [
      { id: 'iba-1', bin: 'bin-oak-a01-r01-s01', variant: 'var-mbp16-512', qty: 45 },
      { id: 'iba-2', bin: 'bin-oak-a01-r01-s02', variant: 'var-iph16-des', qty: 80 },
      { id: 'iba-3', bin: 'bin-oak-v01-r01-s01', variant: 'var-mbp16-1tb', qty: 30 },
    ];

    for (const a of allocations) {
      await db.execute(
        `INSERT INTO inventory_bin_allocations (id, bin_id, variant_id, quantity_on_hand, quantity_allocated, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [a.id, a.bin, a.variant, a.qty]
      );
      count++;
    }

    // 4. ASN Inbound Shipments
    const asnId = 'asn-inbound-20260915-01';
    await db.execute(
      `INSERT INTO asn_inbound_shipments (
        id, asn_number, warehouse_id, seller_id, carrier_code, tracking_number,
        status, expected_arrival_date, total_units_expected, total_units_received, total_units_damaged, created_at, updated_at
      ) VALUES (?, 'ASN-2026-001', 'wh-oakland-dc', 'seller-apple', 'FEDEX_FREIGHT', 'TRK-ASN-99182', 'IN_RECEIVING', CURRENT_TIMESTAMP, 50, 50, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [asnId]
    );
    count++;

    // 5. ASN Items
    await db.execute(
      `INSERT INTO asn_inbound_items (
        id, asn_id, variant_id, sku, quantity_expected, quantity_received, quantity_damaged, destination_bin_id, status, created_at
      ) VALUES ('asnitm-1', ?, 'var-mbp16-512', 'AAPL-MBP16-512GB-SLV', 50, 50, 0, 'bin-oak-a01-r01-s01', 'RECEIVED', CURRENT_TIMESTAMP)`,
      [asnId]
    );
    count++;

    // 6. Stock Transfer Order
    await db.execute(
      `INSERT INTO stock_transfer_orders (
        id, transfer_number, source_warehouse_id, destination_warehouse_id, status, carrier_code, tracking_number, total_units, created_at, updated_at
      ) VALUES ('xfer-ord-1', 'TO-2026-001', 'wh-oakland-dc', 'wh-newark-dc', 'IN_TRANSIT', 'INTERNAL_FREIGHT', 'TRK-XFER-001', 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    count++;

    // 7. Cycle Count Record
    await db.execute(
      `INSERT INTO inventory_cycle_counts (
        id, count_batch_number, warehouse_id, bin_id, variant_id, system_recorded_quantity, physically_counted_quantity, variance_units, variance_cost_value, status, counted_by_user_id, created_at
      ) VALUES ('cc-rec-1', 'CC-2026-W37', 'wh-oakland-dc', 'bin-oak-a01-r01-s01', 'var-mbp16-512', 45, 45, 0, 0.00, 'RECONCILED', 'user-auditor-1', CURRENT_TIMESTAMP)`
    );
    count++;

    return { count, entityName: 'wms_and_logistics' };
  },
};
