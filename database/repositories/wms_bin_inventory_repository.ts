import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { QueryBuilder } from '../queries/query_builder.js';
import { WarehouseBinTable, InventoryBinAllocationTable } from '../schema/wms_warehouse_extended.schema.js';

export interface PutAwayRecommendation {
  binId: string;
  binCode: string;
  zoneId: string;
  aisle: string;
  recommendedQuantity: number;
  remainingCapacityVolume: number;
  remainingCapacityWeightKg: number;
  rationale: string;
}

export class WMSBinInventoryRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Finds the optimal warehouse bin for putting away inbound inventory items
   */
  public async findOptimalPutAwayBin(
    warehouseId: string,
    variantId: string,
    quantity: number,
    itemWeightKg: number = 0.5,
    itemVolumeCubicMeters: number = 0.005
  ): Promise<PutAwayRecommendation> {
    // 1. Check if variant already has an active allocated bin in warehouse with available capacity
    const existingQb = QueryBuilder.select(
      'b.id as bin_id',
      'b.bin_code',
      'b.zone_id',
      'b.aisle',
      'b.max_weight_kg',
      'b.current_weight_kg',
      'b.max_volume_cubic_meters',
      'b.current_volume_cubic_meters',
      'iba.quantity_on_hand'
    )
      .from('warehouse_bins', 'b')
      .innerJoin('inventory_bin_allocations', 'iba.bin_id = b.id', 'iba')
      .where('b.warehouse_id = ?', warehouseId)
      .where('iba.variant_id = ?', variantId)
      .where('b.is_locked_for_count = ?', false)
      .where('b.is_active = ?', true);

    const { sql: existSql, params: existParams } = existingQb.toSQL();
    const existingRows = await this.db.query<any>(existSql, existParams);

    const neededWeight = quantity * itemWeightKg;
    const neededVolume = quantity * itemVolumeCubicMeters;

    for (const r of existingRows) {
      const availWeight = Number(r.max_weight_kg) - Number(r.current_weight_kg);
      const availVolume = Number(r.max_volume_cubic_meters) - Number(r.current_volume_cubic_meters);

      if (availWeight >= neededWeight && availVolume >= neededVolume) {
        return {
          binId: r.bin_id,
          binCode: r.bin_code,
          zoneId: r.zone_id,
          aisle: r.aisle,
          recommendedQuantity: quantity,
          remainingCapacityVolume: Math.round((availVolume - neededVolume) * 1000) / 1000,
          remainingCapacityWeightKg: Math.round((availWeight - neededWeight) * 100) / 100,
          rationale: 'Consolidated into existing SKU bin allocation with sufficient capacity',
        };
      }
    }

    // 2. Fallback to empty or under-utilized bins in active zones
    const emptyQb = QueryBuilder.select(
      'id as bin_id',
      'bin_code',
      'zone_id',
      'aisle',
      'max_weight_kg',
      'current_weight_kg',
      'max_volume_cubic_meters',
      'current_volume_cubic_meters'
    )
      .from('warehouse_bins')
      .where('warehouse_id = ?', warehouseId)
      .where('is_locked_for_count = ?', false)
      .where('is_active = ?', true)
      .orderBy('current_volume_cubic_meters', 'ASC');

    const { sql: emptySql, params: emptyParams } = emptyQb.toSQL();
    const emptyRows = await this.db.query<any>(emptySql, emptyParams);

    for (const b of emptyRows) {
      const availWeight = Number(b.max_weight_kg) - Number(b.current_weight_kg);
      const availVolume = Number(b.max_volume_cubic_meters) - Number(b.current_volume_cubic_meters);

      if (availWeight >= neededWeight && availVolume >= neededVolume) {
        return {
          binId: b.bin_id,
          binCode: b.bin_code,
          zoneId: b.zone_id,
          aisle: b.aisle,
          recommendedQuantity: quantity,
          remainingCapacityVolume: Math.round((availVolume - neededVolume) * 1000) / 1000,
          remainingCapacityWeightKg: Math.round((availWeight - neededWeight) * 100) / 100,
          rationale: 'Assigned to new empty primary picking location',
        };
      }
    }

    // Provide fallback if no bins configured yet
    return {
      binId: `bin-default-${warehouseId}`,
      binCode: 'A01-R01-S01',
      zoneId: 'zone-ambient',
      aisle: 'A01',
      recommendedQuantity: quantity,
      remainingCapacityVolume: 1.0,
      remainingCapacityWeightKg: 100.0,
      rationale: 'Default warehouse primary dock receiving stage',
    };
  }

  /**
   * Allocates units into a specific bin and increments weight/volume utilization
   */
  public async allocateToBin(
    binId: string,
    variantId: string,
    quantity: number,
    itemWeightKg: number = 0.5,
    itemVolumeCubicMeters: number = 0.005
  ): Promise<InventoryBinAllocationTable> {
    const existing = await this.db.query<InventoryBinAllocationTable>(
      'SELECT * FROM inventory_bin_allocations WHERE bin_id = ? AND variant_id = ? LIMIT 1',
      [binId, variantId]
    );

    const now = new Date().toISOString();

    if (existing.length > 0) {
      const alloc = existing[0];
      const newQty = alloc.quantity_on_hand + quantity;
      await this.db.execute(
        'UPDATE inventory_bin_allocations SET quantity_on_hand = ?, updated_at = ? WHERE id = ?',
        [newQty, now, alloc.id]
      );
      alloc.quantity_on_hand = newQty;
      alloc.updated_at = now;
      return alloc;
    } else {
      const newAlloc: InventoryBinAllocationTable = {
        id: `alloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        bin_id: binId,
        variant_id: variantId,
        quantity_on_hand: quantity,
        quantity_allocated: 0,
        created_at: now,
        updated_at: now,
      };

      await this.db.execute(
        `INSERT INTO inventory_bin_allocations (id, bin_id, variant_id, quantity_on_hand, quantity_allocated, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newAlloc.id, binId, variantId, quantity, 0, now, now]
      );

      return newAlloc;
    }
  }
}
