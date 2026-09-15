/**
 * ShopSphere Database Layer - Database View & Materialized View Definitions
 * Declarative definitions for reporting and analytics views:
 * - v_product_catalog_search (Denormalized products, variants, brands, categories)
 * - v_seller_performance_summary (Seller total orders, gross merchandise value, avg review rating)
 * - v_inventory_stock_alerts (Variants below safety stock thresholds)
 * - v_order_financial_ledger (Orders, payments, coupon discounts, net revenue)
 */

export interface DatabaseViewDefinition {
  name: string;
  isMaterialized: boolean;
  refreshIntervalMinutes?: number;
  description: string;
  querySql: {
    postgres: string;
    sqlite: string;
  };
}

export class ViewRegistry {
  private static views: Map<string, DatabaseViewDefinition> = new Map([
    [
      'v_product_catalog_search',
      {
        name: 'v_product_catalog_search',
        isMaterialized: false,
        description: 'Denormalized view of active products with brand, category, and minimum price',
        querySql: {
          postgres: `
CREATE OR REPLACE VIEW v_product_catalog_search AS
SELECT 
  p.id AS product_id,
  p.title,
  p.slug,
  p.seller_id,
  p.status,
  c.id AS category_id,
  c.name AS category_name,
  b.id AS brand_id,
  b.name AS brand_name,
  MIN(v.price) AS min_price,
  MAX(v.price) AS max_price,
  COALESCE(SUM(inv.quantity_available), 0) AS total_inventory,
  p.created_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_variants v ON v.product_id = p.id
LEFT JOIN inventory inv ON inv.variant_id = v.id
WHERE p.status = 'ACTIVE'
GROUP BY p.id, p.title, p.slug, p.seller_id, p.status, c.id, c.name, b.id, b.name, p.created_at;`,
          sqlite: `
CREATE VIEW IF NOT EXISTS v_product_catalog_search AS
SELECT 
  p.id AS product_id,
  p.title,
  p.slug,
  p.seller_id,
  p.status,
  c.id AS category_id,
  c.name AS category_name,
  b.id AS brand_id,
  b.name AS brand_name,
  MIN(v.price) AS min_price,
  MAX(v.price) AS max_price,
  COALESCE(SUM(inv.quantity_available), 0) AS total_inventory,
  p.created_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_variants v ON v.product_id = p.id
LEFT JOIN inventory inv ON inv.variant_id = v.id
WHERE p.status = 'ACTIVE'
GROUP BY p.id, p.title, p.slug, p.seller_id, p.status, c.id, c.name, b.id, b.name, p.created_at;`,
        },
      },
    ],
    [
      'v_seller_performance_summary',
      {
        name: 'v_seller_performance_summary',
        isMaterialized: false,
        description: 'Aggregate seller store analytics, fulfillment speed, and revenue metrics',
        querySql: {
          postgres: `
CREATE OR REPLACE VIEW v_seller_performance_summary AS
SELECT 
  s.id AS seller_id,
  s.store_name,
  s.rating AS seller_rating,
  s.is_verified,
  COUNT(DISTINCT p.id) AS active_products_count,
  COUNT(DISTINCT o.id) AS total_orders_count,
  COALESCE(SUM(oi.price * oi.quantity), 0) AS gross_merchandise_value,
  COALESCE(AVG(r.rating), 0) AS average_review_rating,
  COUNT(DISTINCT r.id) AS total_reviews_count
FROM sellers s
LEFT JOIN products p ON p.seller_id = s.id AND p.status = 'ACTIVE'
LEFT JOIN order_items oi ON oi.seller_id = s.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'CANCELLED'
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY s.id, s.store_name, s.rating, s.is_verified;`,
          sqlite: `
CREATE VIEW IF NOT EXISTS v_seller_performance_summary AS
SELECT 
  s.id AS seller_id,
  s.store_name,
  s.rating AS seller_rating,
  s.is_verified,
  COUNT(DISTINCT p.id) AS active_products_count,
  COUNT(DISTINCT o.id) AS total_orders_count,
  COALESCE(SUM(oi.price * oi.quantity), 0) AS gross_merchandise_value,
  COALESCE(AVG(r.rating), 0) AS average_review_rating,
  COUNT(DISTINCT r.id) AS total_reviews_count
FROM sellers s
LEFT JOIN products p ON p.seller_id = s.id AND p.status = 'ACTIVE'
LEFT JOIN order_items oi ON oi.seller_id = s.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'CANCELLED'
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY s.id, s.store_name, s.rating, s.is_verified;`,
        },
      },
    ],
    [
      'v_inventory_stock_alerts',
      {
        name: 'v_inventory_stock_alerts',
        isMaterialized: false,
        description: 'Inventory items that have breached restock thresholds',
        querySql: {
          postgres: `
CREATE OR REPLACE VIEW v_inventory_stock_alerts AS
SELECT 
  inv.id AS inventory_id,
  inv.variant_id,
  v.sku,
  p.id AS product_id,
  p.title AS product_title,
  p.seller_id,
  inv.quantity_available,
  inv.quantity_reserved,
  inv.safety_stock,
  CASE 
    WHEN inv.quantity_available <= 0 THEN 'OUT_OF_STOCK'
    WHEN inv.quantity_available <= inv.safety_stock THEN 'LOW_STOCK'
    ELSE 'HEALTHY'
  END AS stock_status
FROM inventory inv
JOIN product_variants v ON v.id = inv.variant_id
JOIN products p ON p.id = v.product_id
WHERE inv.quantity_available <= inv.safety_stock;`,
          sqlite: `
CREATE VIEW IF NOT EXISTS v_inventory_stock_alerts AS
SELECT 
  inv.id AS inventory_id,
  inv.variant_id,
  v.sku,
  p.id AS product_id,
  p.title AS product_title,
  p.seller_id,
  inv.quantity_available,
  inv.quantity_reserved,
  inv.safety_stock,
  CASE 
    WHEN inv.quantity_available <= 0 THEN 'OUT_OF_STOCK'
    WHEN inv.quantity_available <= inv.safety_stock THEN 'LOW_STOCK'
    ELSE 'HEALTHY'
  END AS stock_status
FROM inventory inv
JOIN product_variants v ON v.id = inv.variant_id
JOIN products p ON p.id = v.product_id
WHERE inv.quantity_available <= inv.safety_stock;`,
        },
      },
    ],
  ]);

  public static getView(name: string): DatabaseViewDefinition | undefined {
    return this.views.get(name);
  }

  public static getAllViews(): DatabaseViewDefinition[] {
    return Array.from(this.views.values());
  }

  public static generateAllViewsDDL(dialect: 'postgres' | 'sqlite'): string[] {
    return Array.from(this.views.values()).map((v) => v.querySql[dialect].trim());
  }
}
