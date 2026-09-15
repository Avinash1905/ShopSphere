/**
 * ShopSphere Database Schema - Extended Multi-Warehouse Inventory & Fulfillment Entities
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const WarehousesSchema: TableSchema = {
  tableName: 'warehouses',
  description: 'Physical distribution centers and fulfillment node metadata',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    code: { name: 'code', type: 'VARCHAR', length: 32, isNullable: false, isUnique: true },
    name: { name: 'name', type: 'VARCHAR', length: 128, isNullable: false },
    address_line1: { name: 'address_line1', type: 'VARCHAR', length: 255, isNullable: false },
    city: { name: 'city', type: 'VARCHAR', length: 128, isNullable: false },
    state: { name: 'state', type: 'VARCHAR', length: 128, isNullable: false },
    country: { name: 'country', type: 'VARCHAR', length: 64, isNullable: false },
    postal_code: { name: 'postal_code', type: 'VARCHAR', length: 32, isNullable: false },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    { name: 'idx_wh_code', columns: ['code'], isUnique: true },
  ],
  checks: [],
  relationships: {},
};

export const WarehouseZonesSchema: TableSchema = {
  tableName: 'warehouse_zones',
  description: 'Aisles, shelves, and bin storage locations inside a warehouse',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    warehouse_id: { name: 'warehouse_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    zone_name: { name: 'zone_name', type: 'VARCHAR', length: 64, isNullable: false },
    zone_type: { name: 'zone_type', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'STANDARD' },
    temperature_controlled: { name: 'temperature_controlled', type: 'BOOLEAN', isNullable: false, defaultValue: false },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'warehouse_id', referencedTable: 'warehouses', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_wh_zone_unique', columns: ['warehouse_id', 'zone_name'], isUnique: true },
  ],
  checks: [
    { name: 'chk_zone_type', expression: "zone_type IN ('STANDARD', 'COLD_STORAGE', 'HAZMAT', 'HIGH_VALUE', 'RETURNS')" },
  ],
  relationships: {
    warehouse: { type: 'MANY_TO_ONE', targetTable: 'warehouses', foreignKey: 'warehouse_id' },
  },
};

export const InventoryAllocationsSchema: TableSchema = {
  tableName: 'inventory_allocations',
  description: 'Active order holds and stock reservations preventing double-booking',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    inventory_id: { name: 'inventory_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    order_id: { name: 'order_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    allocated_quantity: { name: 'allocated_quantity', type: 'INTEGER', isNullable: false },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'HELD' },
    expires_at: { name: 'expires_at', type: 'TIMESTAMP', isNullable: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    released_at: { name: 'released_at', type: 'TIMESTAMP', isNullable: true },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'inventory_id', referencedTable: 'inventory', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'order_id', referencedTable: 'orders', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_inv_alloc_order', columns: ['order_id', 'status'] },
    { name: 'idx_inv_alloc_expires', columns: ['status', 'expires_at'] },
  ],
  checks: [
    { name: 'chk_alloc_qty_pos', expression: 'allocated_quantity > 0' },
    { name: 'chk_alloc_status', expression: "status IN ('HELD', 'COMMITTED', 'RELEASED', 'EXPIRED')" },
  ],
  relationships: {
    inventory: { type: 'MANY_TO_ONE', targetTable: 'inventory', foreignKey: 'inventory_id' },
    order: { type: 'MANY_TO_ONE', targetTable: 'orders', foreignKey: 'order_id' },
  },
};

export const InventoryTransfersSchema: TableSchema = {
  tableName: 'inventory_transfers',
  description: 'Stock redistribution workflows between multi-region distribution nodes',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    source_warehouse_id: { name: 'source_warehouse_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    destination_warehouse_id: { name: 'destination_warehouse_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    product_id: { name: 'product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    variant_id: { name: 'variant_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    quantity: { name: 'quantity', type: 'INTEGER', isNullable: false },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'INITIATED' },
    tracking_number: { name: 'tracking_number', type: 'VARCHAR', length: 128, isNullable: true },
    dispatched_at: { name: 'dispatched_at', type: 'TIMESTAMP', isNullable: true },
    received_at: { name: 'received_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'source_warehouse_id', referencedTable: 'warehouses', referencedColumn: 'id', onDelete: 'RESTRICT' },
    { columnName: 'destination_warehouse_id', referencedTable: 'warehouses', referencedColumn: 'id', onDelete: 'RESTRICT' },
    { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'variant_id', referencedTable: 'variants', referencedColumn: 'id', onDelete: 'SET NULL' },
  ],
  indexes: [
    { name: 'idx_inv_transfer_status', columns: ['status'] },
  ],
  checks: [
    { name: 'chk_transfer_qty', expression: 'quantity > 0' },
    { name: 'chk_transfer_status', expression: "status IN ('INITIATED', 'PICKED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED')" },
  ],
  relationships: {
    sourceWarehouse: { type: 'MANY_TO_ONE', targetTable: 'warehouses', foreignKey: 'source_warehouse_id' },
    destinationWarehouse: { type: 'MANY_TO_ONE', targetTable: 'warehouses', foreignKey: 'destination_warehouse_id' },
    product: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'product_id' },
    variant: { type: 'MANY_TO_ONE', targetTable: 'variants', foreignKey: 'variant_id' },
  },
};

export const StockAlertRulesSchema: TableSchema = {
  tableName: 'stock_alert_rules',
  description: 'Automated reorder triggers and safety stock thresholds per warehouse/SKU',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    product_id: { name: 'product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    variant_id: { name: 'variant_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    warehouse_id: { name: 'warehouse_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    reorder_point: { name: 'reorder_point', type: 'INTEGER', isNullable: false, defaultValue: 10 },
    reorder_quantity: { name: 'reorder_quantity', type: 'INTEGER', isNullable: false, defaultValue: 50 },
    safety_stock: { name: 'safety_stock', type: 'INTEGER', isNullable: false, defaultValue: 5 },
    notify_email: { name: 'notify_email', type: 'VARCHAR', length: 255, isNullable: true },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'variant_id', referencedTable: 'variants', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'warehouse_id', referencedTable: 'warehouses', referencedColumn: 'id', onDelete: 'SET NULL' },
  ],
  indexes: [
    { name: 'idx_alert_rule_target', columns: ['product_id', 'variant_id', 'warehouse_id'] },
  ],
  checks: [
    { name: 'chk_reorder_point_pos', expression: 'reorder_point >= 0' },
    { name: 'chk_reorder_qty_pos', expression: 'reorder_quantity > 0' },
  ],
  relationships: {
    product: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'product_id' },
    variant: { type: 'MANY_TO_ONE', targetTable: 'variants', foreignKey: 'variant_id' },
    warehouse: { type: 'MANY_TO_ONE', targetTable: 'warehouses', foreignKey: 'warehouse_id' },
  },
};

SchemaRegistry.register(WarehousesSchema);
SchemaRegistry.register(WarehouseZonesSchema);
SchemaRegistry.register(InventoryAllocationsSchema);
SchemaRegistry.register(InventoryTransfersSchema);
SchemaRegistry.register(StockAlertRulesSchema);
