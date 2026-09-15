import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedCatalogSeeder: Seeder = {
  name: 'ExtendedCatalogSeeder',
  order: 9,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const products = await db.query<{ id: string }>('SELECT id FROM products LIMIT 10');
    let inserted = 0;

    // 1. Seed Dynamic Attributes
    const attrs = [
      { id: 'attr-color', name: 'Color', code: 'color', type: 'COLOR', order: 1 },
      { id: 'attr-storage', name: 'Storage Capacity', code: 'storage_gb', type: 'NUMBER', order: 2 },
      { id: 'attr-wireless', name: 'Wireless Connectivity', code: 'is_wireless', type: 'BOOLEAN', order: 3 },
    ];
    for (const a of attrs) {
      await db.execute(`
        INSERT INTO product_attributes (id, name, code, attribute_type, is_filterable, is_searchable, display_order, created_at)
        VALUES ('${a.id}', '${a.name}', '${a.code}', '${a.type}', 1, 1, ${a.order}, datetime('now'))
      `);
      inserted++;
    }

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      // Seed Attribute Values
      await db.execute(`
        INSERT INTO product_attribute_values (id, product_id, attribute_id, text_value, numeric_value, boolean_value, created_at)
        VALUES (
          'attrval-seed-${i + 1}',
          '${p.id}',
          'attr-storage',
          '512GB',
          512.00,
          0,
          datetime('now')
        );
      `);
      inserted++;

      // Seed Media Gallery
      await db.execute(`
        INSERT INTO product_media_gallery (id, product_id, media_type, url, is_primary, sort_order, created_at)
        VALUES (
          'media-seed-${i + 1}',
          '${p.id}',
          'IMAGE',
          'https://images.shopsphere.com/products/${p.id}/hero.webp',
          1,
          0,
          datetime('now')
        );
      `);
      inserted++;

      // Seed Pricing Tiers
      await db.execute(`
        INSERT INTO product_pricing_tiers (id, product_id, min_quantity, unit_price, currency, customer_group, created_at)
        VALUES (
          'tier-seed-${i + 1}',
          '${p.id}',
          10,
          89.99,
          'USD',
          'WHOLESALE_GOLD',
          datetime('now')
        );
      `);
      inserted++;
    }

    return { count: inserted, entityName: 'extended_catalog' };
  },
};
