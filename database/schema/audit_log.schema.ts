import { TableSchema, SchemaRegistry } from './types.js';

export interface AuditLogEntity {
  id: string;
  actor_id?: string;
  actor_type: 'USER' | 'SYSTEM' | 'ANONYMOUS' | 'SERVICE' | 'CRON';
  actor_email?: string;
  action: string;
  entity_name: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  metadata?: Record<string, any>;
  created_at: string;
}

export const AuditLogTableSchema: TableSchema = {
  tableName: 'audit_logs',
  description: 'Immutable append-only audit trail logging all state mutations, security events, and compliance triggers',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    actor_id: {
      name: 'actor_id',
      type: 'UUID',
      isNullable: true,
    },
    actor_type: {
      name: 'actor_type',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'USER',
      isNullable: false,
      checkConstraint: "actor_type IN ('USER', 'SYSTEM', 'ANONYMOUS', 'SERVICE', 'CRON')",
    },
    actor_email: {
      name: 'actor_email',
      type: 'VARCHAR',
      length: 255,
      isNullable: true,
    },
    action: {
      name: 'action',
      type: 'VARCHAR',
      length: 120,
      isNullable: false,
      description: 'Granular action code e.g. USER_REGISTERED, PRODUCT_PRICE_UPDATED, ORDER_CANCELLED',
    },
    entity_name: {
      name: 'entity_name',
      type: 'VARCHAR',
      length: 64,
      isNullable: false,
      description: 'Domain table or entity name being modified',
    },
    entity_id: {
      name: 'entity_id',
      type: 'VARCHAR',
      length: 128,
      isNullable: false,
      description: 'ID of target entity',
    },
    old_values: {
      name: 'old_values',
      type: 'JSONB',
      isNullable: true,
      description: 'Prior state snapshot with sensitive PII masked',
    },
    new_values: {
      name: 'new_values',
      type: 'JSONB',
      isNullable: true,
      description: 'New modified state snapshot with sensitive PII masked',
    },
    changed_fields: {
      name: 'changed_fields',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: true,
      description: 'Array of top-level field names modified',
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
    session_id: {
      name: 'session_id',
      type: 'VARCHAR',
      length: 128,
      isNullable: true,
    },
    request_id: {
      name: 'request_id',
      type: 'VARCHAR',
      length: 128,
      isNullable: true,
    },
    status: {
      name: 'status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'SUCCESS',
      isNullable: false,
      checkConstraint: "status IN ('SUCCESS', 'FAILURE', 'WARNING')",
    },
    severity: {
      name: 'severity',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'INFO',
      isNullable: false,
      checkConstraint: "severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')",
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
  },
  primaryKey: ['id'],
  foreignKeys: [
    {
      columnName: 'actor_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'SET NULL',
    },
  ],
  indexes: [
    {
      name: 'idx_audit_entity_lookup',
      columns: ['entity_name', 'entity_id'],
    },
    {
      name: 'idx_audit_actor_created',
      columns: ['actor_id', 'created_at'],
    },
    {
      name: 'idx_audit_action_created',
      columns: ['action', 'created_at'],
    },
    {
      name: 'idx_audit_severity_created',
      columns: ['severity', 'created_at'],
    },
  ],
  checks: [],
  relationships: {
    actor: {
      type: 'MANY_TO_ONE',
      targetTable: 'users',
      foreignKey: 'actor_id',
    },
  },
};

SchemaRegistry.register(AuditLogTableSchema);
