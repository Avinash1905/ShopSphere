import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedOrderSeeder: Seeder = {
  name: 'ExtendedOrderSeeder',
  order: 11,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const orders = await db.query<{ id: string }>('SELECT id FROM orders LIMIT 5');
    let inserted = 0;

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];

      // 1. Seed Order Fulfillment
      await db.execute(`
        INSERT INTO order_fulfillments (id, order_id, warehouse_id, fulfillment_status, carrier_name, service_tier, tracking_number, shipped_at, created_at)
        VALUES (
          'fulf-seed-${i + 1}',
          '${o.id}',
          'wh-nj-01',
          'SHIPPED',
          'FedEx',
          'Priority Overnight',
          'FDX992834710${i}',
          datetime('now', '-1 day'),
          datetime('now')
        );
      `);
      inserted++;

      // 2. Seed Package Dimensions
      await db.execute(`
        INSERT INTO order_shipment_packages (id, fulfillment_id, package_type, weight_kg, length_cm, width_cm, height_cm, created_at)
        VALUES (
          'pkg-seed-${i + 1}',
          'fulf-seed-${i + 1}',
          'PARCEL_BOX',
          1.850,
          30.00,
          20.00,
          15.00,
          datetime('now')
        );
      `);
      inserted++;

      // 3. Seed Tracking Event
      await db.execute(`
        INSERT INTO order_tracking_events (id, fulfillment_id, event_status, event_location, event_description, event_timestamp, created_at)
        VALUES (
          'trkev-seed-${i + 1}',
          'fulf-seed-${i + 1}',
          'IN_TRANSIT',
          'Newark Sorting Facility, NJ',
          'Package scanned and departed regional transit hub',
          datetime('now', '-12 hours'),
          datetime('now')
        );
      `);
      inserted++;

      // 4. Seed Status History
      await db.execute(`
        INSERT INTO order_status_history (id, order_id, previous_status, new_status, reason, created_at)
        VALUES (
          'hist-seed-${i + 1}',
          '${o.id}',
          'PROCESSING',
          'SHIPPED',
          'Dispatched by warehouse team',
          datetime('now')
        );
      `);
      inserted++;
    }

    return { count: inserted, entityName: 'extended_orders' };
  },
};
