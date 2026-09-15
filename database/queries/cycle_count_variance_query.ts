import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { QueryBuilder } from './query_builder.js';
import { InventoryCycleCountTable } from '../schema/wms_warehouse_extended.schema.js';

export interface CycleCountAuditSummary {
  batchNumber: string;
  warehouseId: string;
  totalLocationsCounted: number;
  locationsWithVariance: number;
  inventoryAccuracyRatePercent: number;
  netUnitVariance: number;
  absoluteUnitVariance: number;
  totalVarianceCostValue: number;
  requiresSupervisorApproval: boolean;
  varianceItems: Array<{
    binId?: string;
    variantId: string;
    systemQty: number;
    countedQty: number;
    varianceUnits: number;
    varianceCost: number;
  }>;
}

export class CycleCountVarianceQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Compiles cycle count audit report and checks approval thresholds
   */
  public async auditBatchVariance(
    batchNumber: string,
    warehouseId: string,
    highValueApprovalThreshold: number = 200.0
  ): Promise<CycleCountAuditSummary> {
    const qb = QueryBuilder.select(
      'id',
      'count_batch_number',
      'warehouse_id',
      'bin_id',
      'variant_id',
      'system_recorded_quantity',
      'physically_counted_quantity',
      'variance_units',
      'variance_cost_value',
      'status'
    )
      .from('inventory_cycle_counts')
      .where('count_batch_number = ?', batchNumber)
      .where('warehouse_id = ?', warehouseId);

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<InventoryCycleCountTable>(sql, params);

    let totSystem = 0;
    let totCounted = 0;
    let netVariance = 0;
    let absVariance = 0;
    let totCost = 0;
    let varianceLocations = 0;

    const varianceItems: CycleCountAuditSummary['varianceItems'] = [];

    for (const r of rows) {
      const sys = Number(r.system_recorded_quantity || 0);
      const phys = Number(r.physically_counted_quantity || 0);
      const varUnits = phys - sys;
      const varCost = Number(r.variance_cost_value || varUnits * 20.0);

      totSystem += sys;
      totCounted += phys;
      netVariance += varUnits;
      absVariance += Math.abs(varUnits);
      totCost += Math.abs(varCost);

      if (varUnits !== 0) {
        varianceLocations++;
        varianceItems.push({
          binId: r.bin_id,
          variantId: r.variant_id,
          systemQty: sys,
          countedQty: phys,
          varianceUnits: varUnits,
          varianceCost: Math.round(varCost * 100) / 100,
        });
      }
    }

    const accuracy = totSystem > 0
      ? Math.max(0, Math.round((1 - absVariance / totSystem) * 10000) / 100)
      : 100;

    const requiresApproval = totCost >= highValueApprovalThreshold || absVariance >= 10;

    return {
      batchNumber,
      warehouseId,
      totalLocationsCounted: rows.length,
      locationsWithVariance: varianceLocations,
      inventoryAccuracyRatePercent: accuracy,
      netUnitVariance: netVariance,
      absoluteUnitVariance: absVariance,
      totalVarianceCostValue: Math.round(totCost * 100) / 100,
      requiresSupervisorApproval: requiresApproval,
      varianceItems,
    };
  }
}
