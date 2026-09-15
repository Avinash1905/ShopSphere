import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface LowStockAlertItem {
  variantId: string;
  sku: string;
  productTitle: string;
  quantityOnHand: number;
  quantityAvailable: number;
  safetyStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
}

export class InventoryQueries {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async getLowStockAlerts(warehouse?: string): Promise<LowStockAlertItem[]> {
    const qb = QueryBuilder.select(
      'v.id as variant_id',
      'v.sku',
      'p.title as product_title',
      'i.quantity_on_hand',
      'i.quantity_available',
      'i.safety_stock_threshold',
      'i.reorder_point',
      'i.reorder_quantity'
    )
      .from('inventory', 'i')
      .innerJoin('variants', 'v.id = i.variant_id', 'v')
      .innerJoin('products', 'p.id = v.product_id', 'p')
      .where('i.quantity_available <= i.safety_stock_threshold')
      .where("v.status = 'ACTIVE'")
      .where('v.deleted_at IS NULL');

    if (warehouse) {
      qb.where('i.warehouse_location = ?', warehouse);
    }
    qb.orderBy('i.quantity_available', 'ASC');

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    return rows.map((r) => ({
      variantId: r.variant_id,
      sku: r.sku,
      productTitle: r.product_title,
      quantityOnHand: Number(r.quantity_on_hand),
      quantityAvailable: Number(r.quantity_available),
      safetyStockThreshold: Number(r.safety_stock_threshold),
      reorderPoint: Number(r.reorder_point),
      reorderQuantity: Number(r.reorder_quantity),
    }));
  }

  public async getInventoryValuation(): Promise<{ totalSkus: number; totalUnits: number; totalCostValue: number; totalRetailValue: number }> {
    const qb = QueryBuilder.select(
      'COUNT(v.id) as total_skus',
      'COALESCE(SUM(i.quantity_on_hand), 0) as total_units',
      'COALESCE(SUM(i.quantity_on_hand * COALESCE(v.cost_price, v.price * 0.6)), 0) as total_cost_value',
      'COALESCE(SUM(i.quantity_on_hand * v.price), 0) as total_retail_value'
    )
      .from('inventory', 'i')
      .innerJoin('variants', 'v.id = i.variant_id', 'v')
      .where("v.status = 'ACTIVE'")
      .where('v.deleted_at IS NULL');

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    return {
      totalSkus: Number(rows[0]?.total_skus || 0),
      totalUnits: Number(rows[0]?.total_units || 0),
      totalCostValue: Math.round(Number(rows[0]?.total_cost_value || 0) * 100) / 100,
      totalRetailValue: Math.round(Number(rows[0]?.total_retail_value || 0) * 100) / 100,
    };
  }
}
