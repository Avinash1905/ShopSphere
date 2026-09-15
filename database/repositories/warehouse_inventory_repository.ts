/**
 * ShopSphere Database Repositories - Multi-Warehouse Inventory, Allocations & Transfer Workflows
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address_line1: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryAllocation {
  id: string;
  inventory_id: string;
  order_id: string;
  allocated_quantity: number;
  status: 'HELD' | 'COMMITTED' | 'RELEASED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
  released_at?: string;
}

export interface InventoryTransfer {
  id: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  status: 'INITIATED' | 'PICKED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  tracking_number?: string;
  dispatched_at?: string;
  received_at?: string;
  created_at: string;
}

export interface StockAlertRule {
  id: string;
  product_id: string;
  variant_id?: string;
  warehouse_id?: string;
  reorder_point: number;
  reorder_quantity: number;
  safety_stock: number;
  notify_email?: string;
  is_active: boolean;
  created_at: string;
}

export class WarehouseInventoryRepository extends BaseRepository<Warehouse> {
  constructor(db: MigrationDatabaseAdapter) {
    super('warehouses', db);
  }

  public async getByCode(code: string): Promise<Warehouse | null> {
    return this.findOne({ code });
  }

  public async holdStockAllocation(
    inventoryId: string,
    orderId: string,
    quantity: number,
    holdDurationMinutes: number = 15
  ): Promise<InventoryAllocation> {
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000).toISOString();
    const id = `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const clean = this.unmapEntity({
      id,
      inventory_id: inventoryId,
      order_id: orderId,
      allocated_quantity: quantity,
      status: 'HELD',
      expires_at: expiresAt,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO inventory_allocations (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );

    const rows = await this.db.query<InventoryAllocation>('SELECT * FROM inventory_allocations WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as InventoryAllocation;
  }

  public async commitAllocation(allocationId: string): Promise<InventoryAllocation> {
    await this.db.execute(
      `UPDATE inventory_allocations SET status = 'COMMITTED' WHERE id = ? AND status = 'HELD'`,
      [allocationId]
    );
    const rows = await this.db.query<InventoryAllocation>('SELECT * FROM inventory_allocations WHERE id = ?', [allocationId]);
    return this.mapRow(rows[0]) as unknown as InventoryAllocation;
  }

  public async releaseExpiredAllocations(): Promise<number> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE inventory_allocations
      SET status = 'EXPIRED', released_at = ?
      WHERE status = 'HELD' AND expires_at < ?
    `;
    const res = await this.db.execute(sql, [now, now]);
    return res.rowsAffected;
  }

  public async initiateTransfer(transfer: Omit<InventoryTransfer, 'id' | 'status' | 'created_at'> & { id?: string }): Promise<InventoryTransfer> {
    const id = transfer.id || `transf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...transfer,
      status: 'INITIATED',
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO inventory_transfers (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<InventoryTransfer>('SELECT * FROM inventory_transfers WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as InventoryTransfer;
  }

  public async updateTransferStatus(transferId: string, status: InventoryTransfer['status']): Promise<InventoryTransfer> {
    const now = new Date().toISOString();
    const updates: Record<string, any> = { status };
    if (status === 'IN_TRANSIT') updates.dispatched_at = now;
    if (status === 'RECEIVED') updates.received_at = now;

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await this.db.execute(
      `UPDATE inventory_transfers SET ${setClauses} WHERE id = ?`,
      [...Object.values(updates), transferId]
    );

    const rows = await this.db.query<InventoryTransfer>('SELECT * FROM inventory_transfers WHERE id = ?', [transferId]);
    return this.mapRow(rows[0]) as unknown as InventoryTransfer;
  }

  public async checkStockAlertThresholds(): Promise<Array<{ product_id: string; current_stock: number; reorder_point: number }>> {
    const sql = `
      SELECT r.product_id, COALESCE(SUM(i.quantity), 0) as current_stock, r.reorder_point
      FROM stock_alert_rules r
      LEFT JOIN inventory i ON r.product_id = i.product_id
      WHERE r.is_active = 1
      GROUP BY r.product_id, r.reorder_point
      HAVING current_stock <= r.reorder_point
    `;
    const rows = await this.db.query<any>(sql);
    return rows.map(r => ({
      product_id: r.product_id,
      current_stock: Number(r.current_stock),
      reorder_point: Number(r.reorder_point),
    }));
  }
}
