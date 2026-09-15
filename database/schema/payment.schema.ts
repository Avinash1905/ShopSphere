import { TableSchema, SchemaRegistry } from './types.js';

export interface PaymentEntity {
  id: string;
  order_id: string;
  user_id: string;
  payment_reference: string;
  payment_method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'UPI' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';
  payment_gateway: string;
  gateway_transaction_id?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  error_code?: string;
  error_message?: string;
  refunded_amount: number;
  refund_reason?: string;
  idempotency_key?: string;
  metadata?: Record<string, any>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionEntity {
  id: string;
  payment_id: string;
  transaction_type: 'AUTHORIZATION' | 'CAPTURE' | 'VOID' | 'REFUND' | 'CHARGEBACK';
  amount: number;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  gateway_payload?: Record<string, any>;
  created_at: string;
}

export const PaymentTableSchema: TableSchema = {
  tableName: 'payments',
  description: 'Payment records, gateway interactions, fraud checks, and settlement statuses',
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
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isNullable: false,
    },
    payment_reference: {
      name: 'payment_reference',
      type: 'VARCHAR',
      length: 100,
      isUnique: true,
      isNullable: false,
    },
    payment_method: {
      name: 'payment_method',
      type: 'VARCHAR',
      length: 32,
      isNullable: false,
      checkConstraint: "payment_method IN ('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE', 'UPI', 'BANK_TRANSFER', 'CASH_ON_DELIVERY')",
    },
    payment_gateway: {
      name: 'payment_gateway',
      type: 'VARCHAR',
      length: 64,
      isNullable: false,
    },
    gateway_transaction_id: {
      name: 'gateway_transaction_id',
      type: 'VARCHAR',
      length: 128,
      isNullable: true,
    },
    amount: {
      name: 'amount',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      isNullable: false,
      checkConstraint: 'amount >= 0.0',
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
      defaultValue: 'PENDING',
      isNullable: false,
      checkConstraint: "status IN ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')",
    },
    error_code: {
      name: 'error_code',
      type: 'VARCHAR',
      length: 64,
      isNullable: true,
    },
    error_message: {
      name: 'error_message',
      type: 'TEXT',
      isNullable: true,
    },
    refunded_amount: {
      name: 'refunded_amount',
      type: 'DECIMAL',
      precision: 14,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
    },
    refund_reason: {
      name: 'refund_reason',
      type: 'VARCHAR',
      length: 255,
      isNullable: true,
    },
    idempotency_key: {
      name: 'idempotency_key',
      type: 'VARCHAR',
      length: 128,
      isUnique: true,
      isNullable: true,
      description: 'API idempotency key for preventing duplicate payment charges',
    },
    metadata: {
      name: 'metadata',
      type: 'JSONB',
      defaultValue: {},
      isNullable: true,
    },
    processed_at: {
      name: 'processed_at',
      type: 'TIMESTAMP',
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
      columnName: 'order_id',
      referencedTable: 'orders',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
  ],
  indexes: [
    {
      name: 'idx_payments_order_id',
      columns: ['order_id'],
    },
    {
      name: 'idx_payments_ref_unique',
      columns: ['payment_reference'],
      isUnique: true,
    },
    {
      name: 'idx_payments_gateway_txn',
      columns: ['payment_gateway', 'gateway_transaction_id'],
      wherePredicate: 'gateway_transaction_id IS NOT NULL',
    },
    {
      name: 'idx_payments_status_created',
      columns: ['status', 'created_at'],
    },
  ],
  checks: [
    {
      name: 'chk_payments_amount_positive',
      expression: 'amount >= 0.0',
    },
    {
      name: 'chk_payments_refunded_valid',
      expression: 'refunded_amount >= 0.0 AND refunded_amount <= amount',
    },
  ],
  relationships: {
    order: {
      type: 'MANY_TO_ONE',
      targetTable: 'orders',
      foreignKey: 'order_id',
    },
    user: {
      type: 'MANY_TO_ONE',
      targetTable: 'users',
      foreignKey: 'user_id',
    },
  },
};

SchemaRegistry.register(PaymentTableSchema);
