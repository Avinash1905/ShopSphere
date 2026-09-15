/**
 * ShopSphere Database Schema - Extended User & Authentication Entities
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const UserMfaDevicesSchema: TableSchema = {
  tableName: 'user_mfa_devices',
  description: 'Multi-factor authentication devices, TOTP secrets, WebAuthn credentials',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    device_name: { name: 'device_name', type: 'VARCHAR', length: 128, isNullable: false },
    device_type: { name: 'device_type', type: 'VARCHAR', length: 32, isNullable: false },
    secret_encrypted: { name: 'secret_encrypted', type: 'TEXT', isNullable: false },
    backup_codes_encrypted: { name: 'backup_codes_encrypted', type: 'TEXT', isNullable: true },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    last_used_at: { name: 'last_used_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_mfa_user_active', columns: ['user_id', 'is_active'] },
  ],
  checks: [
    { name: 'chk_mfa_device_type', expression: "device_type IN ('TOTP', 'WEBAUTHN', 'SMS', 'EMAIL_OTP')" },
  ],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const UserOAuthProvidersSchema: TableSchema = {
  tableName: 'user_oauth_providers',
  description: 'Linked social login identity provider accounts (Google, Apple, GitHub)',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    provider_name: { name: 'provider_name', type: 'VARCHAR', length: 64, isNullable: false },
    provider_user_id: { name: 'provider_user_id', type: 'VARCHAR', length: 255, isNullable: false },
    access_token_encrypted: { name: 'access_token_encrypted', type: 'TEXT', isNullable: true },
    refresh_token_encrypted: { name: 'refresh_token_encrypted', type: 'TEXT', isNullable: true },
    token_expires_at: { name: 'token_expires_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_oauth_provider_uid', columns: ['provider_name', 'provider_user_id'], isUnique: true },
    { name: 'idx_oauth_user', columns: ['user_id'] },
  ],
  checks: [],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const UserPasswordHistoriesSchema: TableSchema = {
  tableName: 'user_password_histories',
  description: 'Historical password hashes to enforce password change reuse policies',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    password_hash: { name: 'password_hash', type: 'VARCHAR', length: 255, isNullable: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_pwd_hist_user_created', columns: ['user_id', 'created_at'] },
  ],
  checks: [],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const UserSessionsSchema: TableSchema = {
  tableName: 'user_sessions',
  description: 'Active authentication user sessions, refresh tokens, and device fingerprinting',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    session_token_hash: { name: 'session_token_hash', type: 'VARCHAR', length: 128, isNullable: false, isUnique: true },
    ip_address: { name: 'ip_address', type: 'VARCHAR', length: 45, isNullable: false },
    user_agent: { name: 'user_agent', type: 'TEXT', isNullable: true },
    device_fingerprint: { name: 'device_fingerprint', type: 'VARCHAR', length: 128, isNullable: true },
    is_revoked: { name: 'is_revoked', type: 'BOOLEAN', isNullable: false, defaultValue: false },
    expires_at: { name: 'expires_at', type: 'TIMESTAMP', isNullable: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    last_accessed_at: { name: 'last_accessed_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_session_token', columns: ['session_token_hash'], isUnique: true },
    { name: 'idx_session_user_revoked', columns: ['user_id', 'is_revoked'] },
  ],
  checks: [],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const UserApiKeysSchema: TableSchema = {
  tableName: 'user_api_keys',
  description: 'Scoped programmatic API credentials for external integrations and sellers',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    key_name: { name: 'key_name', type: 'VARCHAR', length: 128, isNullable: false },
    key_prefix: { name: 'key_prefix', type: 'VARCHAR', length: 16, isNullable: false },
    key_hash: { name: 'key_hash', type: 'VARCHAR', length: 128, isNullable: false, isUnique: true },
    scopes: { name: 'scopes', type: 'JSON', isNullable: false },
    rate_limit_per_minute: { name: 'rate_limit_per_minute', type: 'INTEGER', isNullable: false, defaultValue: 60 },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    expires_at: { name: 'expires_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    last_used_at: { name: 'last_used_at', type: 'TIMESTAMP', isNullable: true },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_api_key_hash', columns: ['key_hash'], isUnique: true },
    { name: 'idx_api_key_user', columns: ['user_id', 'is_active'] },
  ],
  checks: [],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

SchemaRegistry.register(UserMfaDevicesSchema);
SchemaRegistry.register(UserOAuthProvidersSchema);
SchemaRegistry.register(UserPasswordHistoriesSchema);
SchemaRegistry.register(UserSessionsSchema);
SchemaRegistry.register(UserApiKeysSchema);
