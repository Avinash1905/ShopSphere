import { TableSchema, SchemaRegistry } from './types.js';

export interface OrderEntity {
  id: string;
  order_number: string;
  user_id: string;
  seller_id?: string;
  order_status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
  payment_status: 'UNPAID' | 'AUTHORIZED' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED';
  shipping_status: 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_fee: number;
  grand_total: number;
  coupon_id?: string;
  shipping_address_id: string;
  billing_address_id: string;
  tracking_number?: string;
  shipping_carrier?: string;
  estimated_delivery_at?: string;
  actual_delivery_at?: string;
  customer_notes?: string;
  internal_notes?: string;
  ip_address?: string;
  user_agent?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderItemEntity {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  seller_id: string;
  product_title: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_price: number;
  item_status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  created_at: string;
  updated_at: string;
}

export const OrderTableSchema: TableSchema = {
  tableName: 'orders',
  description: 'Customer purchase orders with financial totals, lifecycle status, and shipping information',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    order_number: {
      name: 'order_number',
      type: 'VARCHAR',
      length: 64,
      isUnique: true,
      isNullable: false,
    },
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isNullable: false,
    },
    seller_id: {
      name: 'seller_id',
      type: 'UUID',
      isNullable: true,
    },
    order_status: {
      name: 'order_status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'PENDING',
      isNullable: false,
      checkConstraint: "order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED')",
    },
    payment_status: {
      name: 'payment_status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'UNPAID',
      isNullable: false,
      checkConstraint: "payment_status IN ('UNPAID', 'AUTHORIZED', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED')",
    },
    shipping_status: {
      name: 'shipping_status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'UNFULFILLED',
      isNullable: false,
      checkConstraint: "shipping_status IN ('UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED')",
    },
    currency: {
      name: 'currency',
      type: 'VARCHAR',
      length: 3,
      defaultValue: 'USD',
      isNullable: false,
    },
    subtotal_amount: {
      name: 'subtotal_amount',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      isNullable: false,
      defaultValue: 0.0,
    },
    discount_amount: {
      name: 'discount_amount',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    tax_amount: {
      name: 'tax_amount',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    shipping_fee: {
      name: 'shipping_fee',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    grand_total: {
      name: 'grand_total',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      isNullable: false,
    },
    coupon_id: {
      name: 'coupon_id',
      type: 'UUID',
      isNullable: true,
    },
    shipping_address_id: {
      name: 'shipping_address_id',
      type: 'UUID',
      isNullable: false,
    },
    billing_address_id: {
      name: 'billing_address_id',
      type: 'UUID',
      isNullable: false,
    },
    tracking_number: {
      name: 'tracking_number',
      type: 'VARCHAR',
      length: 128,
      isNullable: true,
    },
    shipping_carrier: {
      name: 'shipping_carrier',
      type: 'VARCHAR',
      length: 64,
      isNullable: true,
    },
    estimated_delivery_at: {
      name: 'estimated_delivery_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    actual_delivery_at: {
      name: 'actual_delivery_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    customer_notes: {
      name: 'customer_notes',
      type: 'TEXT',
      isNullable: true,
    },
    internal_notes: {
      name: 'internal_notes',
      type: 'TEXT',
      isNullable: true,
    },
    ip_address: {
      name: 'ip_address',
      type: 'VARCHAR',
      length: 45,
      isNullable: true,
    },
    user_agent: {
      name: 'user_agent',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    cancelled_at: {
      name: 'cancelled_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    cancellation_reason: {
      name: 'cancellation_reason',
      type: 'VARCHAR',
      length: 255,
      isNullable: true,
    },
    metadata: {
      name: 'metadata',
      type: 'JSONB',
      defaultValue: {},
      isNullable: true,
    },
    created_at: {
      name: 'created_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      name: 'updated_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [
    {
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'shipping_address_id',
      referencedTable: 'addresses',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'billing_address_id',
      referencedTable: 'addresses',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
  ],
  indexes: [
    {
      name: 'idx_orders_order_number_unique',
      columns: ['order_number'],
      isUnique: true,
    },
    {
      name: 'idx_orders_user_created',
      columns: ['user_id', 'created_at'],
    },
    {
      name: 'idx_orders_status_created',
      columns: ['order_status', 'created_at'],
    },
    {
      name: 'idx_orders_seller_status',
      columns: ['seller_id', 'order_status'],
      wherePredicate: 'seller_id IS NOT NULL',
    },
  ],
  checks: [
    {
      name: 'chk_orders_grand_total_positive',
      expression: 'grand_total >= 0.0',
    },
  ],
  relationships: {
    user: {
      type: 'MANY_TO_ONE',
      targetTable: 'users',
      foreignKey: 'user_id',
    },
    items: {
      type: 'ONE_TO_MANY',
      targetTable: 'order_items',
      foreignKey: 'order_id',
    },
    payments: {
      type: 'ONE_TO_MANY',
      targetTable: 'payments',
      foreignKey: 'order_id',
    },
  },
};

export const OrderItemTableSchema: TableSchema = {
  tableName: 'order_items',
  description: 'Purchased individual product line items recorded inside orders',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    order_id: {
      name: 'order_id',
      type: 'UUID',
      isNullable: false,
    },
    product_id: {
      name: 'product_id',
      type: 'UUID',
      isNullable: false,
    },
    variant_id: {
      name: 'variant_id',
      type: 'UUID',
      isNullable: false,
    },
    seller_id: {
      name: 'seller_id',
      type: 'UUID',
      isNullable: false,
    },
    product_title: {
      name: 'product_title',
      type: 'VARCHAR',
      length: 255,
      isNullable: false,
    },
    sku: {
      name: 'sku',
      type: 'VARCHAR',
      length: 100,
      isNullable: false,
    },
    quantity: {
      name: 'quantity',
      type: 'INTEGER',
      defaultValue: 1,
      isNullable: false,
      checkConstraint: 'quantity > 0',
    },
    unit_price: {
      name: 'unit_price',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: false,
      checkConstraint: 'unit_price >= 0.0',
    },
    discount_amount: {
      name: 'discount_amount',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    tax_amount: {
      name: 'tax_amount',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    total_price: {
      name: 'total_price',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: false,
    },
    item_status: {
      name: 'item_status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'PENDING',
      isNullable: false,
      checkConstraint: "item_status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')",
    },
    created_at: {
      name: 'created_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      name: 'updated_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [
    {
      columnName: 'order_id',
      referencedTable: 'orders',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'product_id',
      referencedTable: 'products',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'variant_id',
      referencedTable: 'variants',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'seller_id',
      referencedTable: 'sellers',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
  ],
  indexes: [
    {
      name: 'idx_order_items_order_id',
      columns: ['order_id'],
    },
    {
      name: 'idx_order_items_seller_status',
      columns: ['seller_id', 'item_status'],
    },
    {
      name: 'idx_order_items_variant_id',
      columns: ['variant_id'],
    },
  ],
  checks: [
    {
      name: 'chk_order_items_quantity_positive',
      expression: 'quantity > 0',
    },
  ],
  relationships: {
    order: {
      type: 'MANY_TO_ONE',
      targetTable: 'orders',
      foreignKey: 'order_id',
    },
    product: {
      type: 'MANY_TO_ONE',
      targetTable: 'products',
      foreignKey: 'product_id',
    },
    variant: {
      type: 'MANY_TO_ONE',
      targetTable: 'variants',
      foreignKey: 'variant_id',
    },
    seller: {
      type: 'MANY_TO_ONE',
      targetTable: 'sellers',
      foreignKey: 'seller_id',
    },
  },
};

SchemaRegistry.register(OrderTableSchema);
SchemaRegistry.register(OrderItemTableSchema);
