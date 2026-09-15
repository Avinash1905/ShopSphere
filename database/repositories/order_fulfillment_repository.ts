/**
 * ShopSphere Database Repositories - Order Fulfillment, Shipment Tracking & Status Lifecycle History
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface OrderFulfillment {
  id: string;
  order_id: string;
  warehouse_id: string;
  fulfillment_status: 'UNFULFILLED' | 'PACKING' | 'PICKED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
  carrier_name?: string;
  service_tier?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface OrderShipmentPackage {
  id: string;
  fulfillment_id: string;
  package_type: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  shipping_label_url?: string;
  created_at: string;
}

export interface OrderTrackingEvent {
  id: string;
  fulfillment_id: string;
  event_status: string;
  event_location?: string;
  event_description: string;
  event_timestamp: string;
  raw_payload?: any;
  created_at: string;
}

export interface OrderStatusHistoryRecord {
  id: string;
  order_id: string;
  previous_status?: string;
  new_status: string;
  reason?: string;
  changed_by_user_id?: string;
  created_at: string;
}

export interface OrderCancellation {
  id: string;
  order_id: string;
  cancelled_by_type: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SYSTEM_FRAUD' | 'SYSTEM_TIMEOUT';
  cancellation_code: string;
  notes?: string;
  refund_requested: boolean;
  created_at: string;
}

export class OrderFulfillmentRepository extends BaseRepository<OrderFulfillment> {
  constructor(db: MigrationDatabaseAdapter) {
    super('order_fulfillments', db);
  }

  public async createFulfillment(fulfillment: Omit<OrderFulfillment, 'id' | 'created_at'> & { id?: string }): Promise<OrderFulfillment> {
    const id = fulfillment.id || `fulf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    return this.create({
      id,
      ...fulfillment,
      created_at: now,
    });
  }

  public async addTrackingEvent(event: Omit<OrderTrackingEvent, 'id' | 'created_at'> & { id?: string }): Promise<OrderTrackingEvent> {
    const id = event.id || `trkev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...event,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO order_tracking_events (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<OrderTrackingEvent>('SELECT * FROM order_tracking_events WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as OrderTrackingEvent;
  }

  public async getTrackingTimeline(fulfillmentId: string): Promise<OrderTrackingEvent[]> {
    const sql = `SELECT * FROM order_tracking_events WHERE fulfillment_id = ? ORDER BY event_timestamp ASC`;
    const rows = await this.db.query<OrderTrackingEvent>(sql, [fulfillmentId]);
    return rows.map(r => this.mapRow(r) as unknown as OrderTrackingEvent);
  }

  public async recordStatusTransition(
    orderId: string,
    previousStatus: string | undefined,
    newStatus: string,
    reason?: string,
    changedByUserId?: string
  ): Promise<OrderStatusHistoryRecord> {
    const id = `ordhist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      order_id: orderId,
      previous_status: previousStatus,
      new_status: newStatus,
      reason,
      changed_by_user_id: changedByUserId,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO order_status_history (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<OrderStatusHistoryRecord>('SELECT * FROM order_status_history WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as OrderStatusHistoryRecord;
  }

  public async cancelOrder(cancellation: Omit<OrderCancellation, 'id' | 'created_at'> & { id?: string }): Promise<OrderCancellation> {
    const id = cancellation.id || `ordcan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...cancellation,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO order_cancellations (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<OrderCancellation>('SELECT * FROM order_cancellations WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as OrderCancellation;
  }
}
