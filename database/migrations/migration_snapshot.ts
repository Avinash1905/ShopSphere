/**
 * ShopSphere Database Layer - Migration Schema Snapshot Engine
 * Serializes database table definitions into versioned JSON schema snapshots.
 */

import { TableSchema } from '../schema/types.js';
import * as crypto from 'crypto';

export interface SchemaSnapshot {
  version: string;
  timestamp: string;
  checksum: string;
  tables: Record<string, {
    columnsCount: number;
    columns: string[];
    indexes: string[];
    foreignKeys: string[];
  }>;
}

export class MigrationSnapshotEngine {
  public static createSnapshot(version: string, tables: Map<string, TableSchema>): SchemaSnapshot {
    const tableData: SchemaSnapshot['tables'] = {};
    const sortedTableNames = Array.from(tables.keys()).sort();

    for (const name of sortedTableNames) {
      const def = tables.get(name)!;
      tableData[name] = {
        columnsCount: Object.keys(def.columns).length,
        columns: Object.values(def.columns).map((c) => `${c.name}:${c.type}:${c.isNullable}`),
        indexes: (def.indexes || []).map((i) => `${i.name}:${i.columns.join(',')}:${i.isUnique}`),
        foreignKeys: (def.foreignKeys || []).map((f) => `${f.columnName}->${f.referencedTable}.${f.referencedColumn}`),
      };
    }

    const serialized = JSON.stringify(tableData);
    const checksum = crypto.createHash('sha256').update(serialized).digest('hex');

    return {
      version,
      timestamp: new Date().toISOString(),
      checksum,
      tables: tableData,
    };
  }

  public static verifyDrift(snapshotA: SchemaSnapshot, snapshotB: SchemaSnapshot): boolean {
    return snapshotA.checksum === snapshotB.checksum;
  }
}
