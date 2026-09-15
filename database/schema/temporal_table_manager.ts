/**
 * ShopSphere Database Schema - Temporal Table & System-Versioned History Engine
 * Manages point-in-time state reconstruction, bi-temporal snapshots, and audit trail generation
 */

import { TableSchema } from './types.js';

export interface TemporalRecord<T = Record<string, any>> {
  id: string;
  entityId: string;
  validFrom: Date;
  validTo: Date;
  sysPeriodStart: Date;
  sysPeriodEnd: Date;
  data: T;
  version: number;
  changedByUserId?: string;
  changeReason?: string;
}

export interface PointInTimeQueryOptions {
  asOf: Date;
  includeDeleted?: boolean;
}

export class TemporalTableManager {
  private historyTables: Map<string, TableSchema> = new Map();

  /**
   * Generates a temporal history table schema for any base table
   */
  public generateHistorySchema(baseSchema: TableSchema): TableSchema {
    const historyTableName = `${baseSchema.tableName}_history`;
    
    const historyColumns = {
      history_id: { name: 'history_id', type: 'VARCHAR' as const, length: 64, isPrimary: true, isNullable: false },
      entity_id: { name: 'entity_id', type: 'VARCHAR' as const, length: 64, isNullable: false, isIndexed: true },
      version: { name: 'version', type: 'INTEGER' as const, isNullable: false, defaultValue: 1 },
      valid_from: { name: 'valid_from', type: 'TIMESTAMP' as const, isNullable: false },
      valid_to: { name: 'valid_to', type: 'TIMESTAMP' as const, isNullable: false, defaultValue: '9999-12-31 23:59:59' },
      sys_period_start: { name: 'sys_period_start', type: 'TIMESTAMP' as const, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      sys_period_end: { name: 'sys_period_end', type: 'TIMESTAMP' as const, isNullable: false, defaultValue: '9999-12-31 23:59:59' },
      changed_by_user_id: { name: 'changed_by_user_id', type: 'VARCHAR' as const, length: 64, isNullable: true },
      change_action: { name: 'change_action', type: 'VARCHAR' as const, length: 16, isNullable: false }, // INSERT, UPDATE, DELETE
      payload_snapshot: { name: 'payload_snapshot', type: 'JSON' as const, isNullable: false },
    };

    const historySchema: TableSchema = {
      tableName: historyTableName,
      description: `System-versioned temporal audit history for ${baseSchema.tableName}`,
      columns: historyColumns,
      primaryKey: ['history_id'],
      foreignKeys: [],
      indexes: [
        { name: `idx_${baseSchema.tableName}_hist_entity`, columns: ['entity_id', 'valid_from', 'valid_to'] },
        { name: `idx_${baseSchema.tableName}_hist_period`, columns: ['sys_period_start', 'sys_period_end'] },
      ],
      checks: [
        { name: `chk_${baseSchema.tableName}_hist_validity`, expression: 'valid_to >= valid_from' },
        { name: `chk_${baseSchema.tableName}_hist_action`, expression: "change_action IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')" },
      ],
      relationships: {},
    };

    this.historyTables.set(baseSchema.tableName, historySchema);
    return historySchema;
  }

  /**
   * Generates SQL DDL to create temporal tracking triggers on MySQL / Postgres
   */
  public generateTemporalTriggersSql(baseSchema: TableSchema): string {
    const table = baseSchema.tableName;
    const historyTable = `${table}_history`;
    
    return [
      `-- Temporal tracking trigger for ${table} on UPDATE`,
      `DELIMITER $$`,
      `CREATE TRIGGER trg_${table}_temporal_update`,
      `AFTER UPDATE ON ${table}`,
      `FOR EACH ROW`,
      `BEGIN`,
      `  INSERT INTO ${historyTable} (`,
      `    history_id, entity_id, version, valid_from, valid_to, sys_period_start, sys_period_end, change_action, payload_snapshot`,
      `  ) VALUES (`,
      `    UUID(), OLD.id, COALESCE(OLD.version, 1), OLD.updated_at, NOW(), OLD.created_at, NOW(), 'UPDATE', JSON_OBJECT('id', OLD.id)`,
      `  );`,
      `END$$`,
      `DELIMITER ;`,
    ].join('\n');
  }

  /**
   * Builds an AS OF query for point-in-time time travel
   */
  public buildAsOfQuery(tableName: string, entityId: string, asOf: Date): { query: string; params: any[] } {
    const historyTable = `${tableName}_history`;
    const asOfStr = asOf.toISOString();

    const query = [
      `SELECT entity_id, version, valid_from, valid_to, payload_snapshot, change_action`,
      `FROM ${historyTable}`,
      `WHERE entity_id = ?`,
      `  AND valid_from <= ?`,
      `  AND valid_to > ?`,
      `ORDER BY version DESC LIMIT 1;`,
    ].join(' ');

    return {
      query,
      params: [entityId, asOfStr, asOfStr],
    };
  }

  public getHistorySchema(tableName: string): TableSchema | undefined {
    return this.historyTables.get(tableName);
  }
}
