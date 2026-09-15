/**
 * ShopSphere Database Schema - Extended Order Fulfillment, Tracking & Lifecycle Entities
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const OrderFulfillmentsSchema: TableSchema = {
  tableName: 'order_fulfillments',
  description: 'Fulfillment batches, carrier service level, and package assignments',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    order_id: { name: 'order_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    warehouse_id: { name: 'warehouse_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    fulfillment_status: { name: 'fulfillment_status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'UNFULFILLED' },
    carrier_name: { name: 'carrier_name', type: 'VARCHAR', length: 64, isNullable: true },
    service_tier: { name: 'service_tier', type: 'VARCHAR', length: 64, isNullable: true },
    tracking_number: { name: 'tracking_number', type: 'VARCHAR', length: 128, isNullable: true },
    shipped_at: { name: 'shipped_at', type: 'TIMESTAMP', isNullable: true },
    delivered_at: { name: 'delivered_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'order_id', referencedTable: 'orders', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'warehouse_id', referencedTable: 'warehouses', referencedColumn: 'id', onDelete: 'RESTRICT' },
  ],
  indexes: [
    { name: 'idx_fulf_order_status', columns: ['order_id', 'fulfillment_status'] },
    { name: 'idx_fulf_tracking', columns: ['tracking_number'] },
  ],
  checks: [
    { name: 'chk_fulf_status', expression: "fulfillment_status IN ('UNFULFILLED', 'PACKING', 'PICKED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED')" },
  ],
  relationships: {
    order: { type: 'MANY_TO_ONE', targetTable: 'orders', foreignKey: 'order_id' },
    warehouse: { type: 'MANY_TO_ONE', targetTable: 'warehouses', foreignKey: 'warehouse_id' },
  },
};

export const OrderShipmentPackagesSchema: TableSchema = {
  tableName: 'order_shipment_packages',
  description: 'Physical parcel dimensions, weight, label QR data, and box type',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    fulfillment_id: { name: 'fulfillment_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    package_type: { name: 'package_type', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'BOX' },
    weight_kg: { name: 'weight_kg', type: 'DECIMAL', precision: 8, scale: 3, isNullable: false },
    length_cm: { name: 'length_cm', type: 'DECIMAL', precision: 8, scale: 2, isNullable: false },
    width_cm: { name: 'width_cm', type: 'DECIMAL', precision: 8, scale: 2, isNullable: false },
    height_cm: { name: 'height_cm', type: 'DECIMAL', precision: 8, scale: 2, isNullable: false },
    shipping_label_url: { name: 'shipping_label_url', type: 'TEXT', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'fulfillment_id', referencedTable: 'order_fulfillments', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_package_fulf', columns: ['fulfillment_id'] },
  ],
  checks: [
    { name: 'chk_pkg_weight_pos', expression: 'weight_kg > 0' },
  ],
  relationships: {
    fulfillment: { type: 'MANY_TO_ONE', targetTable: 'order_fulfillments', foreignKey: 'fulfillment_id' },
  },
};

export const OrderTrackingEventsSchema: TableSchema = {
  tableName: 'order_tracking_events',
  description: 'Real-time carrier webhook timeline events and GPS checkpoints',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    fulfillment_id: { name: 'fulfillment_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    event_status: { name: 'event_status', type: 'VARCHAR', length: 64, isNullable: false },
    event_location: { name: 'event_location', type: 'VARCHAR', length: 255, isNullable: true },
    event_description: { name: 'event_description', type: 'TEXT', isNullable: false },
    event_timestamp: { name: 'event_timestamp', type: 'TIMESTAMP', isNullable: false },
    raw_payload: { name: 'raw_payload', type: 'JSON', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'fulfillment_id', referencedTable: 'order_fulfillments', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_tracking_fulf_time', columns: ['fulfillment_id', 'event_timestamp'] },
  ],
  checks: [],
  relationships: {
    fulfillment: { type: 'MANY_TO_ONE', targetTable: 'order_fulfillments', foreignKey: 'fulfillment_id' },
  },
};

export const OrderStatusHistorySchema: TableSchema = {
  tableName: 'order_status_history',
  description: 'Immutable transition log of order state machine history',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    order_id: { name: 'order_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    previous_status: { name: 'previous_status', type: 'VARCHAR', length: 32, isNullable: true },
    new_status: { name: 'new_status', type: 'VARCHAR', length: 32, isNullable: false },
    reason: { name: 'reason', type: 'TEXT', isNullable: true },
    changed_by_user_id: { name: 'changed_by_user_id', type: 'VARCHAR', length: 64, isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'order_id', referencedTable: 'orders', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'changed_by_user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'SET NULL' },
  ],
  indexes: [
    { name: 'idx_order_hist_order_created', columns: ['order_id', 'created_at'] },
  ],
  checks: [],
  relationships: {
    order: { type: 'MANY_TO_ONE', targetTable: 'orders', foreignKey: 'order_id' },
    changedBy: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'changed_by_user_id' },
  },
};

export const OrderCancellationsSchema: TableSchema = {
  tableName: 'order_cancellations',
  description: 'Detailed cancellation reasoning, initiator type, and penalty assessments',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    order_id: { name: 'order_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true, isUnique: true },
    cancelled_by_type: { name: 'cancelled_by_type', type: 'VARCHAR', length: 32, isNullable: false },
    cancellation_code: { name: 'cancellation_code', type: 'VARCHAR', length: 64, isNullable: false },
    notes: { name: 'notes', type: 'TEXT', isNullable: true },
    refund_requested: { name: 'refund_requested', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'order_id', referencedTable: 'orders', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_order_cancel_unique', columns: ['order_id'], isUnique: true },
  ],
  checks: [
    { name: 'chk_cancel_by_type', expression: "cancelled_by_type IN ('CUSTOMER', 'SELLER', 'ADMIN', 'SYSTEM_FRAUD', 'SYSTEM_TIMEOUT')" },
  ],
  relationships: {
    order: { type: 'MANY_TO_ONE', targetTable: 'orders', foreignKey: 'order_id' },
  },
};

SchemaRegistry.register(OrderFulfillmentsSchema);
SchemaRegistry.register(OrderShipmentPackagesSchema);
SchemaRegistry.register(OrderTrackingEventsSchema);
SchemaRegistry.register(OrderStatusHistorySchema);
SchemaRegistry.register(OrderCancellationsSchema);
