import { TableSchema, SchemaRegistry } from './types.js';

export interface CartEntity {
  id: string;
  user_id?: string;
  session_id?: string;
  currency: string;
  status: 'ACTIVE' | 'MERGED' | 'CONVERTED' | 'ABANDONED';
  total_discount_amount: number;
  coupon_id?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CartItemEntity {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  custom_attributes?: Record<string, any>;
  added_at: string;
  updated_at: string;
}

export const CartTableSchema: TableSchema = {
  tableName: 'carts',
  description: 'Shopping carts for authenticated customers and guest sessions',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isNullable: true,
    },
    session_id: {
      name: 'session_id',
      type: 'VARCHAR',
      length: 128,
      isNullable: true,
    },
    currency: {
      name: 'currency',
      type: 'VARCHAR',
      length: 3,
      defaultValue: 'USD',
      isNullable: false,
    },
    status: {
      name: 'status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'ACTIVE',
      isNullable: false,
      checkConstraint: "status IN ('ACTIVE', 'MERGED', 'CONVERTED', 'ABANDONED')",
    },
    total_discount_amount: {
      name: 'total_discount_amount',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    coupon_id: {
      name: 'coupon_id',
      type: 'UUID',
      isNullable: true,
    },
    expires_at: {
      name: 'expires_at',
      type: 'TIMESTAMP',
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
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_carts_user_status',
      columns: ['user_id', 'status'],
    },
    {
      name: 'idx_carts_session_status',
      columns: ['session_id', 'status'],
    },
  ],
  checks: [
    {
      name: 'chk_carts_user_or_session',
      expression: 'user_id IS NOT NULL OR session_id IS NOT NULL',
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
      targetTable: 'cart_items',
      foreignKey: 'cart_id',
    },
  },
};

export const CartItemTableSchema: TableSchema = {
  tableName: 'cart_items',
  description: 'Individual line items added to shopping carts',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    cart_id: {
      name: 'cart_id',
      type: 'UUID',
      isNullable: false,
    },
    variant_id: {
      name: 'variant_id',
      type: 'UUID',
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
    total_price: {
      name: 'total_price',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: false,
      checkConstraint: 'total_price >= 0.0',
    },
    custom_attributes: {
      name: 'custom_attributes',
      type: 'JSONB',
      defaultValue: {},
      isNullable: true,
    },
    added_at: {
      name: 'added_at',
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
      columnName: 'cart_id',
      referencedTable: 'carts',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'variant_id',
      referencedTable: 'variants',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_cart_items_cart_variant',
      columns: ['cart_id', 'variant_id'],
      isUnique: true,
    },
  ],
  checks: [
    {
      name: 'chk_cart_items_qty_positive',
      expression: 'quantity > 0',
    },
  ],
  relationships: {
    cart: {
      type: 'MANY_TO_ONE',
      targetTable: 'carts',
      foreignKey: 'cart_id',
    },
    variant: {
      type: 'MANY_TO_ONE',
      targetTable: 'variants',
      foreignKey: 'variant_id',
    },
  },
};

SchemaRegistry.register(CartTableSchema);
SchemaRegistry.register(CartItemTableSchema);
