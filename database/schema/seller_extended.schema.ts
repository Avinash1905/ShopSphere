/**
 * ShopSphere Database Schema - Extended Seller & Marketplace Merchant Entities
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const SellerKycVerificationsSchema: TableSchema = {
  tableName: 'seller_kyc_verifications',
  description: 'Merchant identity verification, tax ID, company registration, and compliance level',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    seller_id: { name: 'seller_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    document_type: { name: 'document_type', type: 'VARCHAR', length: 64, isNullable: false },
    document_number_hash: { name: 'document_number_hash', type: 'VARCHAR', length: 128, isNullable: false },
    document_url_encrypted: { name: 'document_url_encrypted', type: 'TEXT', isNullable: false },
    verification_status: { name: 'verification_status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'PENDING' },
    rejection_reason: { name: 'rejection_reason', type: 'TEXT', isNullable: true },
    verified_by_user_id: { name: 'verified_by_user_id', type: 'VARCHAR', length: 64, isNullable: true },
    verified_at: { name: 'verified_at', type: 'TIMESTAMP', isNullable: true },
    expires_at: { name: 'expires_at', type: 'TIMESTAMP', isNullable: true },
    metadata: { name: 'metadata', type: 'JSON', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'seller_id', referencedTable: 'sellers', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'verified_by_user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'SET NULL' },
  ],
  indexes: [
    { name: 'idx_kyc_seller_status', columns: ['seller_id', 'verification_status'] },
  ],
  checks: [
    { name: 'chk_kyc_status', expression: "verification_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')" },
  ],
  relationships: {
    seller: { type: 'MANY_TO_ONE', targetTable: 'sellers', foreignKey: 'seller_id' },
  },
};

export const SellerPayoutAccountsSchema: TableSchema = {
  tableName: 'seller_payout_accounts',
  description: 'Seller banking credentials, Stripe Connect accounts, and payout destination settings',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    seller_id: { name: 'seller_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    account_type: { name: 'account_type', type: 'VARCHAR', length: 32, isNullable: false },
    account_holder_name: { name: 'account_holder_name', type: 'VARCHAR', length: 255, isNullable: false },
    routing_number_encrypted: { name: 'routing_number_encrypted', type: 'TEXT', isNullable: true },
    account_number_last4: { name: 'account_number_last4', type: 'VARCHAR', length: 4, isNullable: false },
    account_number_encrypted: { name: 'account_number_encrypted', type: 'TEXT', isNullable: false },
    currency: { name: 'currency', type: 'VARCHAR', length: 3, isNullable: false, defaultValue: 'USD' },
    is_primary: { name: 'is_primary', type: 'BOOLEAN', isNullable: false, defaultValue: false },
    is_verified: { name: 'is_verified', type: 'BOOLEAN', isNullable: false, defaultValue: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'seller_id', referencedTable: 'sellers', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_payout_seller_primary', columns: ['seller_id', 'is_primary'] },
  ],
  checks: [
    { name: 'chk_payout_account_type', expression: "account_type IN ('BANK_ACCOUNT', 'STRIPE_CONNECT', 'PAYPAL')" },
  ],
  relationships: {
    seller: { type: 'MANY_TO_ONE', targetTable: 'sellers', foreignKey: 'seller_id' },
  },
};

export const SellerCommissionTiersSchema: TableSchema = {
  tableName: 'seller_commission_tiers',
  description: 'Volume-based marketplace commission tiers and incentive rate overrides',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    tier_name: { name: 'tier_name', type: 'VARCHAR', length: 64, isNullable: false, isUnique: true },
    min_monthly_volume: { name: 'min_monthly_volume', type: 'DECIMAL', precision: 12, scale: 2, isNullable: false, defaultValue: 0.0 },
    max_monthly_volume: { name: 'max_monthly_volume', type: 'DECIMAL', precision: 12, scale: 2, isNullable: true },
    commission_rate_percentage: { name: 'commission_rate_percentage', type: 'DECIMAL', precision: 5, scale: 2, isNullable: false },
    flat_fee_per_order: { name: 'flat_fee_per_order', type: 'DECIMAL', precision: 6, scale: 2, isNullable: false, defaultValue: 0.30 },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    { name: 'idx_comm_tier_volume', columns: ['min_monthly_volume'] },
  ],
  checks: [
    { name: 'chk_comm_rate_range', expression: 'commission_rate_percentage >= 0 AND commission_rate_percentage <= 50' },
  ],
  relationships: {},
};

export const SellerBadgesSchema: TableSchema = {
  tableName: 'seller_badges',
  description: 'Seller quality credentials, certifications, and merchant trust badges',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    seller_id: { name: 'seller_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    badge_code: { name: 'badge_code', type: 'VARCHAR', length: 64, isNullable: false },
    badge_title: { name: 'badge_title', type: 'VARCHAR', length: 128, isNullable: false },
    awarded_at: { name: 'awarded_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    expires_at: { name: 'expires_at', type: 'TIMESTAMP', isNullable: true },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'seller_id', referencedTable: 'sellers', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_seller_badge_unique', columns: ['seller_id', 'badge_code'], isUnique: true },
  ],
  checks: [],
  relationships: {
    seller: { type: 'MANY_TO_ONE', targetTable: 'sellers', foreignKey: 'seller_id' },
  },
};

export const SellerVacationModesSchema: TableSchema = {
  tableName: 'seller_vacation_modes',
  description: 'Scheduled merchant holiday pauses, inventory concealment, and customer auto-replies',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    seller_id: { name: 'seller_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    start_date: { name: 'start_date', type: 'TIMESTAMP', isNullable: false },
    end_date: { name: 'end_date', type: 'TIMESTAMP', isNullable: false },
    pause_listings: { name: 'pause_listings', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    auto_response_message: { name: 'auto_response_message', type: 'TEXT', isNullable: true },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'seller_id', referencedTable: 'sellers', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_vacation_seller_dates', columns: ['seller_id', 'start_date', 'end_date'] },
  ],
  checks: [
    { name: 'chk_vacation_dates', expression: 'end_date > start_date' },
  ],
  relationships: {
    seller: { type: 'MANY_TO_ONE', targetTable: 'sellers', foreignKey: 'seller_id' },
  },
};

SchemaRegistry.register(SellerKycVerificationsSchema);
SchemaRegistry.register(SellerPayoutAccountsSchema);
SchemaRegistry.register(SellerCommissionTiersSchema);
SchemaRegistry.register(SellerBadgesSchema);
SchemaRegistry.register(SellerVacationModesSchema);
