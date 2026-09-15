import { BaseRepository, FindOptions, PaginatedResult } from './base.repository.js';
import { OrderEntity, OrderItemEntity } from '../schema/order.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class OrderRepository extends BaseRepository<OrderEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('orders', db);
  }

  public async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    return this.findOne({ order_number: orderNumber.trim() });
  }

  public async getOrdersByUser(userId: string, options: FindOptions<OrderEntity> = {}): Promise<PaginatedResult<OrderEntity>> {
    return this.findAll({
      ...options,
      where: { user_id: userId },
      sort: options.sort || [{ field: 'created_at', direction: 'DESC' }],
    });
  }

  public async getOrdersBySeller(sellerId: string, options: FindOptions<OrderEntity> = {}): Promise<PaginatedResult<OrderEntity>> {
    return this.findAll({
      ...options,
      where: { seller_id: sellerId },
      sort: options.sort || [{ field: 'created_at', direction: 'DESC' }],
    });
  }

  public async updateOrderStatus(
    orderId: string,
    newStatus: OrderEntity['order_status'],
    options?: { trackingNumber?: string; carrier?: string; cancellationReason?: string }
  ): Promise<OrderEntity> {
    const updates: Partial<OrderEntity> = { order_status: newStatus };
    if (options?.trackingNumber) updates.tracking_number = options.trackingNumber;
    if (options?.carrier) updates.shipping_carrier = options.carrier;
    if (newStatus === 'CANCELLED') {
      updates.cancelled_at = new Date().toISOString();
      if (options?.cancellationReason) updates.cancellation_reason = options.cancellationReason;
    } else if (newStatus === 'DELIVERED') {
      updates.actual_delivery_at = new Date().toISOString();
    }

    return await this.update(orderId, updates);
  }

  public async getOrderWithItems(orderId: string): Promise<{ order: OrderEntity; items: OrderItemEntity[] } | null> {
    const order = await this.findById(orderId);
    if (!order) return null;

    const rawItems = await this.db.query<OrderItemEntity>(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]);
    const items: OrderItemEntity[] = rawItems.map((r) => ({ ...r }));
    return {
      order,
      items,
    };
  }
}

export class OrderItemRepository extends BaseRepository<OrderItemEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('order_items', db);
  }

  public async getItemsByOrderId(orderId: string): Promise<OrderItemEntity[]> {
    const sql = `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`;
    const rows = await this.db.query<OrderItemEntity>(sql, [orderId]);
    return rows.map((r) => this.mapRow(r));
  }
}
