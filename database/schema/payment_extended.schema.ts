/**
 * ShopSphere Database Schema - Extended Payments, Transactions & Seller Settlements Entities
 * Defines schemas for:
 * - payment_transactions (Gateway lifecycle: AUTHORIZE, CAPTURE, VOID, REFUND)
 * - payment_methods (Customer-saved tokenized credentials, cards, UPI, PayPal)
 * - payment_refunds (Partial and full refunds with automated gateway processing)
 * - payment_disputes (Chargeback claims, reversals, and evidence submissions)
 * - seller_settlements (Periodic gross-net merchant disbursement balances)
 */

import { TableSchema, SchemaRegistry } from './types.js';

export const PaymentTransactionsSchema: TableSchema = {
  tableName: 'payment_transactions',
  description: 'Granular gateway transaction events (authorizations, captures, refunds, voids)',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    payment_id: { name: 'payment_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    transaction_type: { name: 'transaction_type', type: 'VARCHAR', length: 32, isNullable: false },
    amount: { name: 'amount', type: 'DECIMAL', precision: 12, scale: 2, isNullable: false },
    currency: { name: 'currency', type: 'VARCHAR', length: 3, isNullable: false, defaultValue: 'USD' },
    gateway_transaction_id: { name: 'gateway_transaction_id', type: 'VARCHAR', length: 255, isNullable: true, isUnique: true },
    gateway_response_code: { name: 'gateway_response_code', type: 'VARCHAR', length: 64, isNullable: true },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'PENDING' },
    raw_response: { name: 'raw_response', type: 'JSON', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'payment_id', referencedTable: 'payments', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_pay_trans_payment', columns: ['payment_id'] },
    { name: 'idx_pay_trans_gw_id', columns: ['gateway_transaction_id'], isUnique: true },
  ],
  checks: [
    { name: 'chk_gateway_trans_type', expression: "transaction_type IN ('AUTHORIZE', 'CAPTURE', 'VOID', 'REFUND', 'VERIFY_ONLY')" },
    { name: 'chk_gateway_trans_status', expression: "status IN ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED')" },
  ],
  relationships: {
    payment: { type: 'MANY_TO_ONE', targetTable: 'payments', foreignKey: 'payment_id' },
  },
};

export const PaymentMethodsSchema: TableSchema = {
  tableName: 'payment_methods',
  description: 'Customer-saved tokenized credentials, cards, UPI, PayPal',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    method_type: { name: 'method_type', type: 'VARCHAR', length: 32, isNullable: false },
    provider_token: { name: 'provider_token', type: 'TEXT', isNullable: false },
    card_brand: { name: 'card_brand', type: 'VARCHAR', length: 32, isNullable: true },
    last4: { name: 'last4', type: 'VARCHAR', length: 4, isNullable: true },
    expiry_month: { name: 'expiry_month', type: 'INTEGER', isNullable: true },
    expiry_year: { name: 'expiry_year', type: 'INTEGER', isNullable: true },
    is_default: { name: 'is_default', type: 'BOOLEAN', isNullable: false, defaultValue: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_pay_method_user', columns: ['user_id', 'is_default'] },
  ],
  checks: [
    { name: 'chk_method_type', expression: "method_type IN ('CARD', 'UPI', 'PAYPAL', 'NET_BANKING', 'CRYPTO')" },
  ],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const PaymentRefundsSchema: TableSchema = {
  tableName: 'payment_refunds',
  description: 'Payment refund transactions with partial allocations and approval workflow',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    payment_id: { name: 'payment_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    order_id: { name: 'order_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    refund_amount: { name: 'refund_amount', type: 'DECIMAL', precision: 12, scale: 2, isNullable: false },
    currency: { name: 'currency', type: 'VARCHAR', length: 3, isNullable: false, defaultValue: 'USD' },
    reason: { name: 'reason', type: 'TEXT', isNullable: false },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'PENDING' },
    gateway_refund_id: { name: 'gateway_refund_id', type: 'VARCHAR', length: 255, isNullable: true },
    processed_at: { name: 'processed_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'payment_id', referencedTable: 'payments', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'order_id', referencedTable: 'orders', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_refund_payment', columns: ['payment_id'] },
    { name: 'idx_refund_order', columns: ['order_id'] },
  ],
  checks: [
    { name: 'chk_refund_amount_positive', expression: 'refund_amount > 0' },
    { name: 'chk_refund_status', expression: "status IN ('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED')" },
  ],
  relationships: {
    payment: { type: 'MANY_TO_ONE', targetTable: 'payments', foreignKey: 'payment_id' },
    order: { type: 'MANY_TO_ONE', targetTable: 'orders', foreignKey: 'order_id' },
  },
};

export const PaymentDisputesSchema: TableSchema = {
  tableName: 'payment_disputes',
  description: 'Chargeback claims, evidence submission deadlines, and merchant defense records',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    payment_id: { name: 'payment_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    gateway_dispute_id: { name: 'gateway_dispute_id', type: 'VARCHAR', length: 255, isNullable: true, isUnique: true },
    dispute_amount: { name: 'dispute_amount', type: 'DECIMAL', precision: 12, scale: 2, isNullable: false },
    currency: { name: 'currency', type: 'VARCHAR', length: 3, isNullable: false, defaultValue: 'USD' },
    dispute_reason: { name: 'dispute_reason', type: 'VARCHAR', length: 128, isNullable: false },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'NEEDS_RESPONSE' },
    evidence_due_date: { name: 'evidence_due_date', type: 'TIMESTAMP', isNullable: true },
    evidence_data: { name: 'evidence_data', type: 'JSON', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    resolved_at: { name: 'resolved_at', type: 'TIMESTAMP', isNullable: true },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'payment_id', referencedTable: 'payments', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_dispute_payment', columns: ['payment_id'] },
  ],
  checks: [
    { name: 'chk_dispute_status', expression: "status IN ('NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST', 'CLOSED')" },
  ],
  relationships: {
    payment: { type: 'MANY_TO_ONE', targetTable: 'payments', foreignKey: 'payment_id' },
  },
};

export const SellerSettlementsSchema: TableSchema = {
  tableName: 'seller_settlements',
  description: 'Periodic merchant payout balances, net sales, commissions, refunds, and adjustments',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    seller_id: { name: 'seller_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    settlement_period_start: { name: 'settlement_period_start', type: 'TIMESTAMP', isNullable: false },
    settlement_period_end: { name: 'settlement_period_end', type: 'TIMESTAMP', isNullable: false },
    gross_sales_amount: { name: 'gross_sales_amount', type: 'DECIMAL', precision: 14, scale: 2, isNullable: false, defaultValue: 0.00 },
    marketplace_commission_amount: { name: 'marketplace_commission_amount', type: 'DECIMAL', precision: 14, scale: 2, isNullable: false, defaultValue: 0.00 },
    refund_deductions_amount: { name: 'refund_deductions_amount', type: 'DECIMAL', precision: 14, scale: 2, isNullable: false, defaultValue: 0.00 },
    adjustments_amount: { name: 'adjustments_amount', type: 'DECIMAL', precision: 14, scale: 2, isNullable: false, defaultValue: 0.00 },
    net_payout_amount: { name: 'net_payout_amount', type: 'DECIMAL', precision: 14, scale: 2, isNullable: false },
    currency: { name: 'currency', type: 'VARCHAR', length: 3, isNullable: false, defaultValue: 'USD' },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'PENDING' },
    payout_account_id: { name: 'payout_account_id', type: 'VARCHAR', length: 64, isNullable: true },
    transferred_at: { name: 'transferred_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'seller_id', referencedTable: 'sellers', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_settlement_seller_period', columns: ['seller_id', 'settlement_period_start', 'settlement_period_end'] },
  ],
  checks: [
    { name: 'chk_settlement_status', expression: "status IN ('PENDING', 'CALCULATED', 'PROCESSING', 'PAID', 'FAILED')" },
  ],
  relationships: {
    seller: { type: 'MANY_TO_ONE', targetTable: 'sellers', foreignKey: 'seller_id' },
  },
};

SchemaRegistry.register(PaymentTransactionsSchema);
SchemaRegistry.register(PaymentMethodsSchema);
SchemaRegistry.register(PaymentRefundsSchema);
SchemaRegistry.register(PaymentDisputesSchema);
SchemaRegistry.register(SellerSettlementsSchema);
