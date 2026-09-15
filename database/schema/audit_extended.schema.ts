/**
 * ShopSphere Database Schema - Extended Audit, Security & Compliance Entities
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const SecurityEventsLedgerSchema: TableSchema = {
  tableName: 'security_events_ledger',
  description: 'Cryptographically hashed security audit event ledger',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    event_type: { name: 'event_type', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    severity: { name: 'severity', type: 'VARCHAR', length: 16, isNullable: false, defaultValue: 'INFO' },
    actor_user_id: { name: 'actor_user_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    ip_address: { name: 'ip_address', type: 'VARCHAR', length: 45, isNullable: false },
    user_agent: { name: 'user_agent', type: 'TEXT', isNullable: true },
    resource_accessed: { name: 'resource_accessed', type: 'VARCHAR', length: 255, isNullable: true },
    action_status: { name: 'action_status', type: 'VARCHAR', length: 32, isNullable: false },
    event_data: { name: 'event_data', type: 'JSON', isNullable: true },
    tamper_hash: { name: 'tamper_hash', type: 'VARCHAR', length: 128, isNullable: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'actor_user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'SET NULL' },
  ],
  indexes: [
    { name: 'idx_sec_event_actor', columns: ['actor_user_id', 'event_type'] },
    { name: 'idx_sec_event_created', columns: ['created_at'] },
  ],
  checks: [
    { name: 'chk_sec_event_severity', expression: "severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')" },
  ],
  relationships: {
    actor: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'actor_user_id' },
  },
};

export const DataAccessLogsSchema: TableSchema = {
  tableName: 'data_access_logs',
  description: 'PII access logging for GDPR / HIPAA / PCI compliance tracking',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    accessor_user_id: { name: 'accessor_user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    target_table: { name: 'target_table', type: 'VARCHAR', length: 64, isNullable: false },
    target_record_id: { name: 'target_record_id', type: 'VARCHAR', length: 64, isNullable: false },
    pii_fields_accessed: { name: 'pii_fields_accessed', type: 'JSON', isNullable: false },
    access_purpose: { name: 'access_purpose', type: 'VARCHAR', length: 128, isNullable: false },
    ip_address: { name: 'ip_address', type: 'VARCHAR', length: 45, isNullable: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'accessor_user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_data_acc_target', columns: ['target_table', 'target_record_id'] },
    { name: 'idx_data_acc_user', columns: ['accessor_user_id', 'created_at'] },
  ],
  checks: [],
  relationships: {
    accessor: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'accessor_user_id' },
  },
};

export const GdprErasureRequestsSchema: TableSchema = {
  tableName: 'gdpr_erasure_requests',
  description: 'Right to be forgotten deletion requests lifecycle and proof receipts',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    requester_email: { name: 'requester_email', type: 'VARCHAR', length: 255, isNullable: false },
    verification_token: { name: 'verification_token', type: 'VARCHAR', length: 128, isNullable: false },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'PENDING' },
    anonymized_at: { name: 'anonymized_at', type: 'TIMESTAMP', isNullable: true },
    proof_hash: { name: 'proof_hash', type: 'VARCHAR', length: 128, isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    completed_at: { name: 'completed_at', type: 'TIMESTAMP', isNullable: true },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_gdpr_user_status', columns: ['user_id', 'status'] },
  ],
  checks: [
    { name: 'chk_gdpr_status', expression: "status IN ('PENDING', 'VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')" },
  ],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const ComplianceManifestsSchema: TableSchema = {
  tableName: 'compliance_manifests',
  description: 'Automated SOC2 / ISO-27001 compliance state snapshots and control attestations',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    framework: { name: 'framework', type: 'VARCHAR', length: 64, isNullable: false },
    control_id: { name: 'control_id', type: 'VARCHAR', length: 64, isNullable: false },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'PASSED' },
    evidence_url: { name: 'evidence_url', type: 'TEXT', isNullable: true },
    tested_at: { name: 'tested_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    tested_by: { name: 'tested_by', type: 'VARCHAR', length: 64, isNullable: false },
    metadata: { name: 'metadata', type: 'JSON', isNullable: true },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    { name: 'idx_compliance_framework_control', columns: ['framework', 'control_id'] },
  ],
  checks: [
    { name: 'chk_compliance_status', expression: "status IN ('PASSED', 'FAILED', 'EXCEPTION', 'NOT_APPLICABLE')" },
  ],
  relationships: {},
};

SchemaRegistry.register(SecurityEventsLedgerSchema);
SchemaRegistry.register(DataAccessLogsSchema);
SchemaRegistry.register(GdprErasureRequestsSchema);
SchemaRegistry.register(ComplianceManifestsSchema);
