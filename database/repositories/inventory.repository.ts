import { BaseRepository } from './base.repository.js';
import { InventoryEntity } from '../schema/variant_inventory.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class InventoryRepository extends BaseRepository<InventoryEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('inventory', db);
  }

  public async findByVariantId(variantId: string): Promise<InventoryEntity | null> {
    return this.findOne({ variant_id: variantId });
  }

  /**
   * Optimistic Concurrency Stock Reservation
   */
  public async reserveStock(variantId: string, quantity: number): Promise<{ success: boolean; availableAfter: number }> {
    if (quantity <= 0) throw new Error('Reservation quantity must be strictly positive');

    const inv = await this.findByVariantId(variantId);
    if (!inv) throw new Error(`Inventory not found for variant ID: ${variantId}`);

    if (inv.quantity_available < quantity && !inv.allow_backorder) {
      return { success: false, availableAfter: inv.quantity_available };
    }

    const newAvailable = inv.quantity_available - quantity;
    const newReserved = inv.quantity_reserved + quantity;
    const nextVersion = inv.version_lock + 1;
    const now = new Date().toISOString();

    const sql = `
      UPDATE inventory
      SET quantity_available = ?, quantity_reserved = ?, version_lock = ?, updated_at = ?
      WHERE variant_id = ? AND version_lock = ?
    `;

    const res = await this.db.execute(sql, [newAvailable, newReserved, nextVersion, now, variantId, inv.version_lock]);
    if (res.rowsAffected === 0) {
      // Concurrency conflict occurred, version changed in parallel
      throw new Error(`Optimistic concurrency conflict while reserving stock for variant ${variantId}`);
    }

    return { success: true, availableAfter: newAvailable };
  }

  /**
   * Release reserved stock on order cancellation
   */
  public async releaseReservation(variantId: string, quantity: number): Promise<void> {
    if (quantity <= 0) return;

    const inv = await this.findByVariantId(variantId);
    if (!inv) throw new Error(`Inventory not found for variant ID: ${variantId}`);

    const newReserved = Math.max(0, inv.quantity_reserved - quantity);
    const newAvailable = inv.quantity_available + quantity;
    const nextVersion = inv.version_lock + 1;
    const now = new Date().toISOString();

    const sql = `
      UPDATE inventory
      SET quantity_available = ?, quantity_reserved = ?, version_lock = ?, updated_at = ?
      WHERE variant_id = ? AND version_lock = ?
    `;

    const res = await this.db.execute(sql, [newAvailable, newReserved, nextVersion, now, variantId, inv.version_lock]);
    if (res.rowsAffected === 0) {
      throw new Error(`Optimistic concurrency conflict while releasing reservation for variant ${variantId}`);
    }
  }

  /**
   * Fulfill order: deduct from on_hand and reserved
   */
  public async fulfillStock(variantId: string, quantity: number): Promise<void> {
    if (quantity <= 0) return;

    const inv = await this.findByVariantId(variantId);
    if (!inv) throw new Error(`Inventory not found for variant ID: ${variantId}`);

    const newOnHand = Math.max(0, inv.quantity_on_hand - quantity);
    const newReserved = Math.max(0, inv.quantity_reserved - quantity);
    const nextVersion = inv.version_lock + 1;
    const now = new Date().toISOString();

    const sql = `
      UPDATE inventory
      SET quantity_on_hand = ?, quantity_reserved = ?, version_lock = ?, updated_at = ?
      WHERE variant_id = ? AND version_lock = ?
    `;

    const res = await this.db.execute(sql, [newOnHand, newReserved, nextVersion, now, variantId, inv.version_lock]);
    if (res.rowsAffected === 0) {
      throw new Error(`Optimistic concurrency conflict while fulfilling stock for variant ${variantId}`);
    }
  }
}
