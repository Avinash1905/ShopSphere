import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const CatalogSeeder: Seeder = {
  name: 'CatalogSeeder',
  order: 3,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let count = 0;

    // 1. Categories
    const categories = [
      { id: 'cat-electronics', parent_id: null, name: 'Electronics', slug: 'electronics', depth: 0, path: '/electronics' },
      { id: 'cat-computers', parent_id: 'cat-electronics', name: 'Computers & Tablets', slug: 'computers-tablets', depth: 1, path: '/electronics/computers-tablets' },
      { id: 'cat-laptops', parent_id: 'cat-computers', name: 'Laptops', slug: 'laptops', depth: 2, path: '/electronics/computers-tablets/laptops' },
      { id: 'cat-smartphones', parent_id: 'cat-electronics', name: 'Smartphones & Accessories', slug: 'smartphones', depth: 1, path: '/electronics/smartphones' },
      { id: 'cat-audio', parent_id: 'cat-electronics', name: 'Headphones & Audio', slug: 'audio', depth: 1, path: '/electronics/audio' },
      { id: 'cat-apparel', parent_id: null, name: 'Apparel & Footwear', slug: 'apparel', depth: 0, path: '/apparel' },
      { id: 'cat-running', parent_id: 'cat-apparel', name: 'Running Shoes', slug: 'running-shoes', depth: 1, path: '/apparel/running-shoes' },
      { id: 'cat-home', parent_id: null, name: 'Home & Kitchen', slug: 'home-kitchen', depth: 0, path: '/home-kitchen' },
      { id: 'cat-appliances', parent_id: 'cat-home', name: 'Kitchen Appliances', slug: 'kitchen-appliances', depth: 1, path: '/home-kitchen/kitchen-appliances' },
    ];

    for (const c of categories) {
      await db.execute(
        `INSERT OR IGNORE INTO categories (id, parent_id, name, slug, depth_level, hierarchy_path, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [c.id, c.parent_id, c.name, c.slug, c.depth, c.path]
      );
      count++;
    }

    // 2. Brands
    const brands = [
      { id: 'brand-apple', name: 'Apple', slug: 'apple', country: 'US' },
      { id: 'brand-sony', name: 'Sony', slug: 'sony', country: 'JP' },
      { id: 'brand-nike', name: 'Nike', slug: 'nike', country: 'US' },
      { id: 'brand-samsung', name: 'Samsung', slug: 'samsung', country: 'KR' },
      { id: 'brand-kitchenaid', name: 'KitchenAid', slug: 'kitchenaid', country: 'US' },
    ];

    for (const b of brands) {
      await db.execute(
        `INSERT OR IGNORE INTO brands (id, name, slug, country_of_origin, is_verified, is_active)
         VALUES (?, ?, ?, ?, TRUE, TRUE)`,
        [b.id, b.name, b.slug, b.country]
      );
      count++;
    }

    // 3. Products, Variants & Inventory
    const products = [
      {
        id: 'prod-macbook-pro-16',
        seller_id: 'seller-apple',
        category_id: 'cat-laptops',
        brand_id: 'brand-apple',
        title: 'Apple MacBook Pro 16" M3 Max',
        slug: 'apple-macbook-pro-16-m3-max',
        description: 'Supercharged by M3 Max with up to 16-core CPU and 40-core GPU, Liquid Retina XDR display, up to 22 hours battery life.',
        base_price: 3499.0,
        rating: 4.92,
        reviews: 320,
        sales: 1450,
        featured: true,
        variants: [
          { id: 'var-mbp16-512', sku: 'AAPL-MBP16-512GB-SLV', title: 'Silver / 36GB / 512GB SSD', price: 3499.0, stock: 45 },
          { id: 'var-mbp16-1tb', sku: 'AAPL-MBP16-1TB-BLK', title: 'Space Black / 48GB / 1TB SSD', price: 3999.0, stock: 30 },
        ],
      },
      {
        id: 'prod-iphone-16-pro',
        seller_id: 'seller-apple',
        category_id: 'cat-smartphones',
        brand_id: 'brand-apple',
        title: 'Apple iPhone 16 Pro Max 256GB Titanium',
        slug: 'apple-iphone-16-pro-max-256gb',
        description: 'Grade 5 titanium design with Camera Control button, 48MP Fusion camera system, and A18 Pro chip.',
        base_price: 1199.0,
        rating: 4.88,
        reviews: 840,
        sales: 4200,
        featured: true,
        variants: [
          { id: 'var-iph16-des', sku: 'AAPL-IP16PM-256-DES', title: 'Desert Titanium 256GB', price: 1199.0, stock: 120 },
          { id: 'var-iph16-nat', sku: 'AAPL-IP16PM-512-NAT', title: 'Natural Titanium 512GB', price: 1399.0, stock: 85 },
        ],
      },
      {
        id: 'prod-sony-wh1000xm5',
        seller_id: 'seller-sony',
        category_id: 'cat-audio',
        brand_id: 'brand-sony',
        title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        slug: 'sony-wh-1000xm5-wireless-headphones',
        description: 'Industry-leading noise cancellation with 8 microphones, Auto NC Optimizer, and 30-hour battery life with quick charge.',
        base_price: 399.99,
        rating: 4.79,
        reviews: 510,
        sales: 2800,
        featured: true,
        variants: [
          { id: 'var-wh1000-blk', sku: 'SNY-WH1000XM5-BLK', title: 'Midnight Black', price: 399.99, stock: 150 },
          { id: 'var-wh1000-slv', sku: 'SNY-WH1000XM5-SLV', title: 'Platinum Silver', price: 399.99, stock: 90 },
        ],
      },
      {
        id: 'prod-nike-alphafly-3',
        seller_id: 'seller-nike',
        category_id: 'cat-running',
        brand_id: 'brand-nike',
        title: 'Nike Air Zoom Alphafly 3 Road Marathon Racing Shoes',
        slug: 'nike-air-zoom-alphafly-3',
        description: 'Fine-tuned for marathon speed with dual Air Zoom units, full-length carbon fiber Flyplate, and ZoomX foam midsole.',
        base_price: 285.0,
        rating: 4.85,
        reviews: 410,
        sales: 3100,
        featured: true,
        variants: [
          { id: 'var-alphafly-10', sku: 'NKE-ALPH3-US10-WHT', title: 'Volt/White - US 10', price: 285.0, stock: 60 },
          { id: 'var-alphafly-11', sku: 'NKE-ALPH3-US11-WHT', title: 'Volt/White - US 11', price: 285.0, stock: 40 },
        ],
      },
      {
        id: 'prod-samsung-s24-ultra',
        seller_id: 'seller-samsung',
        category_id: 'cat-smartphones',
        brand_id: 'brand-samsung',
        title: 'Samsung Galaxy S24 Ultra 512GB AI Smartphone',
        slug: 'samsung-galaxy-s24-ultra-512gb',
        description: 'Galaxy AI is here. Search like never before, get real-time voice translation on a call, with 200MP camera and built-in S Pen.',
        base_price: 1299.99,
        rating: 4.72,
        reviews: 490,
        sales: 2300,
        featured: false,
        variants: [
          { id: 'var-s24u-gry', sku: 'SAM-S24U-512-TGRY', title: 'Titanium Gray 512GB', price: 1299.99, stock: 75 },
          { id: 'var-s24u-blk', sku: 'SAM-S24U-512-TBLK', title: 'Titanium Black 512GB', price: 1299.99, stock: 80 },
        ],
      },
      {
        id: 'prod-kitchenaid-stand-mixer',
        seller_id: 'seller-kitchen',
        category_id: 'cat-appliances',
        brand_id: 'brand-kitchenaid',
        title: 'KitchenAid Artisan Series 5-Quart Tilt-Head Stand Mixer',
        slug: 'kitchenaid-artisan-series-5-quart-stand-mixer',
        description: 'Durable metal construction with 10 speeds to gently knead, thoroughly mix, and whip ingredients for a wide variety of recipes.',
        base_price: 449.99,
        rating: 4.94,
        reviews: 620,
        sales: 1900,
        featured: true,
        variants: [
          { id: 'var-kmixer-red', sku: 'KA-KSM150-ERED', title: 'Empire Red 5 Qt', price: 449.99, stock: 50 },
          { id: 'var-kmixer-slv', sku: 'KA-KSM150-MSLV', title: 'Matte Silver 5 Qt', price: 449.99, stock: 35 },
        ],
      },
    ];

    for (const p of products) {
      await db.execute(
        `INSERT OR IGNORE INTO products (
          id, seller_id, category_id, brand_id, title, slug, description, status,
          base_price, rating_average, reviews_count, total_sales_count, is_featured, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [p.id, p.seller_id, p.category_id, p.brand_id, p.title, p.slug, p.description, p.base_price, p.rating, p.reviews, p.sales, p.featured]
      );
      count++;

      for (const v of p.variants) {
        await db.execute(
          `INSERT OR IGNORE INTO variants (id, product_id, sku, title, price, status)
           VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
          [v.id, p.id, v.sku, v.title, v.price]
        );

        const invId = `inv-${v.id}`;
        await db.execute(
          `INSERT OR IGNORE INTO inventory (
            id, variant_id, warehouse_location, quantity_on_hand, quantity_reserved, quantity_available, safety_stock_threshold
          ) VALUES (?, ?, 'MAIN_DC', ?, 0, ?, 5)`,
          [invId, v.id, v.stock, v.stock]
        );
        count += 2;
      }
    }

    return { count, entityName: 'catalog_and_inventory' };
  },
};
