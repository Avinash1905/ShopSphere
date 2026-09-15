import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedInventorySeeder: Seeder = {
  name: 'ExtendedInventorySeeder',
  order: 10,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const products = await db.query<{ id: string }>('SELECT id FROM products LIMIT 5');
    let inserted = 0;

    // 1. Seed Warehouses
    await db.execute(`
      INSERT INTO warehouses (id, code, name, address_line1, city, state, country, postal_code, is_active, created_at, updated_at)
      VALUES ('wh-nj-01', 'US-EAST-NJ', 'New Jersey Distribution Hub', '100 Port Rd', 'Elizabeth', 'NJ', 'USA', '07201', 1, datetime('now'), datetime('now'));
    `);
    inserted++;

    await db.execute(`
      INSERT INTO warehouses (id, code, name, address_line1, city, state, country, postal_code, is_active, created_at, updated_at)
      VALUES ('wh-ca-01', 'US-WEST-CA', 'California Gateway Hub', '500 Logistics Blvd', 'Ontario', 'CA', 'USA', '91761', 1, datetime('now'), datetime('now'));
    `);
    inserted++;

    // 2. Seed Warehouse Zones
    await db.execute(`
      INSERT INTO warehouse_zones (id, warehouse_id, zone_name, zone_type, temperature_controlled, is_active)
      VALUES ('zone-nj-a1', 'wh-nj-01', 'Aisle A - High Velocity', 'STANDARD', 0, 1);
    `);
    inserted++;

    await db.execute(`
      INSERT INTO warehouse_zones (id, warehouse_id, zone_name, zone_type, temperature_controlled, is_active)
      VALUES ('zone-nj-b2', 'wh-nj-01', 'Aisle B - Secure Cage', 'HIGH_VALUE', 0, 1);
    `);
    inserted++;

    await db.execute(`
      INSERT INTO warehouse_zones (id, warehouse_id, zone_name, zone_type, temperature_controlled, is_active)
      VALUES ('zone-ca-a1', 'wh-ca-01', 'Bay 1 - Pallet Racks', 'STANDARD', 0, 1);
    `);
    inserted++;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      // Seed Stock Alert Rules
      await db.execute(`
        INSERT INTO stock_alert_rules (id, product_id, warehouse_id, reorder_point, reorder_quantity, safety_stock, notify_email, is_active, created_at)
        VALUES (
          'alert-rule-${i + 1}',
          '${p.id}',
          'wh-nj-01',
          15,
          100,
          10,
          'ops-logistics@shopsphere.com',
          1,
          datetime('now')
        );
      `);
      inserted++;
    }

    return { count: inserted, entityName: 'extended_inventory' };
  },
};
