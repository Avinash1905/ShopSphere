import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface ReorderRecommendation {
  variantId: string;
  sku: string;
  productTitle: string;
  sellerId: string;
  currentAvailableStock: number;
  reservedStock: number;
  dailyVelocity30d: number;
  leadTimeDays: number;
  safetyStockUnits: number;
  reorderPoint: number;
  suggestedReorderQuantity: number;
  daysOfInventoryRemaining: number;
  stockStatus: 'CRITICAL_STOCKOUT' | 'LOW_STOCK' | 'HEALTHY' | 'OVERSTOCKED' | 'DEAD_STOCK';
  estimatedStockoutDate?: string;
  estimatedReorderCost: number;
}

export interface InventoryHealthAuditReport {
  totalSkusAudited: number;
  criticalStockoutCount: number;
  lowStockCount: number;
  healthyCount: number;
  overstockedCount: number;
  deadStockCount: number;
  totalWorkingCapitalTiedUp: number;
  recommendations: ReorderRecommendation[];
}

export class PredictiveReorderInventoryQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Generates predictive reorder analysis for inventory variants based on 30-day demand velocity
   */
  public async analyzeReorderNeeds(
    sellerId?: string,
    defaultLeadTimeDays: number = 14,
    serviceLevelZScore: number = 1.65 // 95% service level
  ): Promise<InventoryHealthAuditReport> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch inventory and product variant details
    const invQb = QueryBuilder.select(
      'i.variant_id',
      'i.quantity_available',
      'i.quantity_reserved',
      'v.sku',
      'v.price',
      'v.cost_price',
      'p.id AS product_id',
      'p.title AS product_title',
      'p.seller_id'
    )
      .from('inventory', 'i')
      .innerJoin('variants', 'v.id = i.variant_id', 'v')
      .innerJoin('products', 'p.id = v.product_id', 'p')
      .where("p.status = 'PUBLISHED'");

    if (sellerId) {
      invQb.where('p.seller_id = ?', sellerId);
    }

    const { sql: invSql, params: invParams } = invQb.toSQL();
    const inventoryRows = await this.db.query<any>(invSql, invParams);

    // 2. Fetch 30-day sales velocity from order_items
    const salesQb = QueryBuilder.select(
      'oi.variant_id',
      'COALESCE(SUM(oi.quantity), 0) AS total_sold_30d',
      'COUNT(DISTINCT oi.order_id) AS order_occurrences'
    )
      .from('order_items', 'oi')
      .innerJoin('orders', 'o.id = oi.order_id', 'o')
      .where('o.created_at >= ?', thirtyDaysAgo)
      .where("o.order_status NOT IN ('CANCELLED', 'REFUNDED')")
      .groupBy('oi.variant_id');

    const salesSQL = salesQb.toSQL();
    const salesRows = await this.db.query<any>(salesSQL.sql, salesSQL.params);
    const salesMap = new Map<string, number>();
    for (const sr of salesRows) {
      salesMap.set(sr.variant_id, Number(sr.total_sold_30d || 0));
    }

    let criticalCount = 0;
    let lowCount = 0;
    let healthyCount = 0;
    let overstockedCount = 0;
    let deadStockCount = 0;
    let totalWorkingCapital = 0;

    const recommendations: ReorderRecommendation[] = [];

    for (const item of inventoryRows) {
      const available = Number(item.quantity_available ?? item.quantity_on_hand ?? 0);
      const reserved = Number(item.quantity_reserved ?? 0);
      const costPrice = Number(item.cost_price || item.price * 0.6 || 20);
      totalWorkingCapital += (available + reserved) * costPrice;

      const sold30d = salesMap.get(item.variant_id) || 0;
      const dailyVelocity = sold30d / 30;

      // Safety stock = Z * sqrt(LeadTime) * StdDev (estimated as 35% of daily velocity)
      const leadTime = defaultLeadTimeDays;
      const stdDevDaily = Math.max(0.5, dailyVelocity * 0.35);
      const safetyStock = Math.ceil(serviceLevelZScore * Math.sqrt(leadTime) * stdDevDaily);
      const reorderPoint = Math.ceil(dailyVelocity * leadTime + safetyStock);

      const daysRemaining = dailyVelocity > 0 ? Math.round(available / dailyVelocity) : 999;

      let status: ReorderRecommendation['stockStatus'] = 'HEALTHY';
      let suggestedOrder = 0;
      let stockoutDate: string | undefined;

      if (available <= 0 && dailyVelocity > 0) {
        status = 'CRITICAL_STOCKOUT';
        criticalCount++;
        suggestedOrder = Math.max(reorderPoint * 2, 50);
        stockoutDate = new Date().toISOString();
      } else if (available <= reorderPoint && dailyVelocity > 0) {
        status = 'LOW_STOCK';
        lowCount++;
        suggestedOrder = Math.ceil(dailyVelocity * 45 + safetyStock - available);
        const daysToOut = Math.round(available / dailyVelocity);
        stockoutDate = new Date(Date.now() + daysToOut * 24 * 60 * 60 * 1000).toISOString();
      } else if (sold30d === 0 && available > 0) {
        status = 'DEAD_STOCK';
        deadStockCount++;
      } else if (daysRemaining > 120) {
        status = 'OVERSTOCKED';
        overstockedCount++;
      } else {
        status = 'HEALTHY';
        healthyCount++;
      }

      recommendations.push({
        variantId: item.variant_id,
        sku: item.sku || 'SKU-UNKNOWN',
        productTitle: item.product_title || 'Untitled Product',
        sellerId: item.seller_id,
        currentAvailableStock: available,
        reservedStock: reserved,
        dailyVelocity30d: Math.round(dailyVelocity * 100) / 100,
        leadTimeDays: leadTime,
        safetyStockUnits: safetyStock,
        reorderPoint,
        suggestedReorderQuantity: Math.max(0, suggestedOrder),
        daysOfInventoryRemaining: daysRemaining,
        stockStatus: status,
        estimatedStockoutDate: stockoutDate,
        estimatedReorderCost: Math.round(Math.max(0, suggestedOrder) * costPrice * 100) / 100,
      });
    }

    // Sort: critical first, then low stock, ordered by daily velocity descending
    recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL_STOCKOUT: 0, LOW_STOCK: 1, DEAD_STOCK: 2, OVERSTOCKED: 3, HEALTHY: 4 };
      if (priorityOrder[a.stockStatus] !== priorityOrder[b.stockStatus]) {
        return priorityOrder[a.stockStatus] - priorityOrder[b.stockStatus];
      }
      return b.dailyVelocity30d - a.dailyVelocity30d;
    });

    return {
      totalSkusAudited: inventoryRows.length,
      criticalStockoutCount: criticalCount,
      lowStockCount: lowCount,
      healthyCount,
      overstockedCount,
      deadStockCount,
      totalWorkingCapitalTiedUp: Math.round(totalWorkingCapital * 100) / 100,
      recommendations,
    };
  }
}
