import { TableSchema, SchemaRegistry } from './types.js';

export interface CouponEntity {
  id: string;
  code: string;
  title: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit_total?: number;
  usage_limit_per_user: number;
  times_used: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  applicable_category_ids: string[];
  applicable_product_ids: string[];
  applicable_seller_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CouponUsageEntity {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string;
  discount_applied: number;
  used_at: string;
}

export const CouponTableSchema: TableSchema = {
  tableName: 'coupons',
  description: 'Promotional discount voucher codes, validation rules, and usage restrictions',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    code: {
      name: 'code',
      type: 'VARCHAR',
      length: 50,
      isUnique: true,
      isNullable: false,
    },
    title: {
      name: 'title',
      type: 'VARCHAR',
      length: 150,
      isNullable: false,
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: true,
    },
    discount_type: {
      name: 'discount_type',
      type: 'VARCHAR',
      length: 32,
      isNullable: false,
      checkConstraint: "discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING')",
    },
    discount_value: {
      name: 'discount_value',
      type: 'DECIMAL',
      precision: 10,
      scale: 2,
      isNullable: false,
      checkConstraint: 'discount_value > 0.0',
    },
    min_order_amount: {
      name: 'min_order_amount',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    max_discount_amount: {
      name: 'max_discount_amount',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: true,
    },
    usage_limit_total: {
      name: 'usage_limit_total',
      type: 'INTEGER',
      isNullable: true,
    },
    usage_limit_per_user: {
      name: 'usage_limit_per_user',
      type: 'INTEGER',
      defaultValue: 1,
      isNullable: false,
    },
    times_used: {
      name: 'times_used',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    start_date: {
      name: 'start_date',
      type: 'TIMESTAMP',
      isNullable: false,
    },
    end_date: {
      name: 'end_date',
      type: 'TIMESTAMP',
      isNullable: false,
    },
    is_active: {
      name: 'is_active',
      type: 'BOOLEAN',
      defaultValue: true,
      isNullable: false,
    },
    applicable_category_ids: {
      name: 'applicable_category_ids',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: false,
    },
    applicable_product_ids: {
      name: 'applicable_product_ids',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: false,
    },
    applicable_seller_ids: {
      name: 'applicable_seller_ids',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: false,
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
  foreignKeys: [],
  indexes: [
    {
      name: 'idx_coupons_code_unique',
      columns: ['code'],
      isUnique: true,
    },
    {
      name: 'idx_coupons_active_window',
      columns: ['is_active', 'start_date', 'end_date'],
    },
  ],
  checks: [
    {
      name: 'chk_coupons_dates_valid',
      expression: 'end_date >= start_date',
    },
    {
      name: 'chk_coupons_times_used_positive',
      expression: 'times_used >= 0',
    },
  ],
  relationships: {
    usages: {
      type: 'ONE_TO_MANY',
      targetTable: 'coupon_usages',
      foreignKey: 'coupon_id',
    },
  },
};

export const CouponUsageTableSchema: TableSchema = {
  tableName: 'coupon_usages',
  description: 'Redemption records tracking coupon applications against orders',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    coupon_id: {
      name: 'coupon_id',
      type: 'UUID',
      isNullable: false,
    },
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isNullable: false,
    },
    order_id: {
      name: 'order_id',
      type: 'UUID',
      isNullable: false,
    },
    discount_applied: {
      name: 'discount_applied',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: false,
    },
    used_at: {
      name: 'used_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [
    {
      columnName: 'coupon_id',
      referencedTable: 'coupons',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'order_id',
      referencedTable: 'orders',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_coupon_usages_coupon_user',
      columns: ['coupon_id', 'user_id'],
    },
    {
      name: 'idx_coupon_usages_order_unique',
      columns: ['order_id'],
      isUnique: true,
    },
  ],
  checks: [],
  relationships: {
    coupon: {
      type: 'MANY_TO_ONE',
      targetTable: 'coupons',
      foreignKey: 'coupon_id',
    },
    user: {
      type: 'MANY_TO_ONE',
      targetTable: 'users',
      foreignKey: 'user_id',
    },
    order: {
      type: 'MANY_TO_ONE',
      targetTable: 'orders',
      foreignKey: 'order_id',
    },
  },
};

SchemaRegistry.register(CouponTableSchema);
SchemaRegistry.register(CouponUsageTableSchema);
