import { TableSchema, SchemaRegistry } from './types.js';

export interface SellerEntity {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  business_name: string;
  business_registration_number?: string;
  tax_id?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  commission_rate_percentage: number;
  payout_bank_name?: string;
  payout_account_number?: string;
  payout_routing_number?: string;
  payout_account_holder?: string;
  rating_average: number;
  total_reviews_count: number;
  total_sales_count: number;
  total_revenue_amount: number;
  support_email: string;
  support_phone?: string;
  return_policy?: string;
  shipping_policy?: string;
  is_featured: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export const SellerTableSchema: TableSchema = {
  tableName: 'sellers',
  description: 'Merchant marketplace seller profiles, stores, verification, and payout configurations',
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
      isUnique: true,
      isNullable: false,
      description: 'Account holding seller privileges',
    },
    store_name: {
      name: 'store_name',
      type: 'VARCHAR',
      length: 150,
      isNullable: false,
    },
    store_slug: {
      name: 'store_slug',
      type: 'VARCHAR',
      length: 150,
      isUnique: true,
      isNullable: false,
    },
    business_name: {
      name: 'business_name',
      type: 'VARCHAR',
      length: 255,
      isNullable: false,
    },
    business_registration_number: {
      name: 'business_registration_number',
      type: 'VARCHAR',
      length: 64,
      isNullable: true,
    },
    tax_id: {
      name: 'tax_id',
      type: 'VARCHAR',
      length: 64,
      isNullable: true,
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: true,
    },
    logo_url: {
      name: 'logo_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    banner_url: {
      name: 'banner_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    verification_status: {
      name: 'verification_status',
      type: 'VARCHAR',
      length: 32,
      isNullable: false,
      defaultValue: 'PENDING',
      checkConstraint: "verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')",
    },
    verification_notes: {
      name: 'verification_notes',
      type: 'TEXT',
      isNullable: true,
    },
    verified_at: {
      name: 'verified_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    verified_by: {
      name: 'verified_by',
      type: 'UUID',
      isNullable: true,
    },
    commission_rate_percentage: {
      name: 'commission_rate_percentage',
      type: 'DECIMAL',
      precision: 5,
      scale: 2,
      defaultValue: 10.0,
      isNullable: false,
      checkConstraint: 'commission_rate_percentage >= 0.0 AND commission_rate_percentage <= 100.0',
    },
    payout_bank_name: {
      name: 'payout_bank_name',
      type: 'VARCHAR',
      length: 128,
      isNullable: true,
    },
    payout_account_number: {
      name: 'payout_account_number',
      type: 'VARCHAR',
      length: 64,
      isNullable: true,
    },
    payout_routing_number: {
      name: 'payout_routing_number',
      type: 'VARCHAR',
      length: 64,
      isNullable: true,
    },
    payout_account_holder: {
      name: 'payout_account_holder',
      type: 'VARCHAR',
      length: 150,
      isNullable: true,
    },
    rating_average: {
      name: 'rating_average',
      type: 'DECIMAL',
      precision: 3,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
      checkConstraint: 'rating_average >= 0.0 AND rating_average <= 5.0',
    },
    total_reviews_count: {
      name: 'total_reviews_count',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    total_sales_count: {
      name: 'total_sales_count',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    total_revenue_amount: {
      name: 'total_revenue_amount',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    support_email: {
      name: 'support_email',
      type: 'VARCHAR',
      length: 255,
      isNullable: false,
    },
    support_phone: {
      name: 'support_phone',
      type: 'VARCHAR',
      length: 32,
      isNullable: true,
    },
    return_policy: {
      name: 'return_policy',
      type: 'TEXT',
      isNullable: true,
    },
    shipping_policy: {
      name: 'shipping_policy',
      type: 'TEXT',
      isNullable: true,
    },
    is_featured: {
      name: 'is_featured',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
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
    deleted_at: {
      name: 'deleted_at',
      type: 'TIMESTAMP',
      isNullable: true,
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
    {
      columnName: 'verified_by',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'SET NULL',
    },
  ],
  indexes: [
    {
      name: 'idx_sellers_user_id',
      columns: ['user_id'],
      isUnique: true,
    },
    {
      name: 'idx_sellers_store_slug_unique',
      columns: ['store_slug'],
      isUnique: true,
    },
    {
      name: 'idx_sellers_verification_status',
      columns: ['verification_status'],
    },
    {
      name: 'idx_sellers_rating_featured',
      columns: ['rating_average', 'is_featured'],
    },
  ],
  checks: [
    {
      name: 'chk_sellers_sales_positive',
      expression: 'total_sales_count >= 0',
    },
    {
      name: 'chk_sellers_reviews_positive',
      expression: 'total_reviews_count >= 0',
    },
    {
      name: 'chk_sellers_revenue_positive',
      expression: 'total_revenue_amount >= 0.0',
    },
  ],
  relationships: {
    user: {
      type: 'ONE_TO_ONE',
      targetTable: 'users',
      foreignKey: 'user_id',
    },
    products: {
      type: 'ONE_TO_MANY',
      targetTable: 'products',
      foreignKey: 'seller_id',
    },
    orders: {
      type: 'ONE_TO_MANY',
      targetTable: 'orders',
      foreignKey: 'seller_id',
    },
  },
};

SchemaRegistry.register(SellerTableSchema);
