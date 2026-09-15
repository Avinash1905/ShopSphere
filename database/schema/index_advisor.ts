/**
 * ShopSphere Database Layer - Index Advisor Engine
 * Analyzes database schemas and query workloads to detect:
 * - Unindexed foreign keys (leading to slow join performance & table-level locks on delete)
 * - Missing covering composite indexes
 * - Redundant / Duplicate indexes
 */

import { TableSchema, IndexDefinition } from './types.js';

export interface IndexRecommendation {
  tableName: string;
  type: 'MISSING_FOREIGN_KEY_INDEX' | 'REDUNDANT_INDEX' | 'LOW_CARDINALITY_WARNING';
  columns: string[];
  reason: string;
  suggestedDDL: string;
}

export class IndexAdvisor {
  public static analyzeTable(table: TableSchema): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    const existingIndexes = table.indexes || [];

    // 1. Check Unindexed Foreign Keys
    for (const fk of table.foreignKeys || []) {
      const isIndexed = existingIndexes.some(
        (idx) => idx.columns[0] === fk.columnName
      );

      if (!isIndexed) {
        const idxName = `idx_${table.tableName}_${fk.columnName}`;
        recommendations.push({
          tableName: table.tableName,
          type: 'MISSING_FOREIGN_KEY_INDEX',
          columns: [fk.columnName],
          reason: `Foreign key '${fk.columnName}' referencing '${fk.referencedTable}' lacks a leading index.`,
          suggestedDDL: `CREATE INDEX IF NOT EXISTS "${idxName}" ON "${table.tableName}" ("${fk.columnName}");`,
        });
      }
    }

    // 2. Check Redundant / Duplicate Indexes
    for (let i = 0; i < existingIndexes.length; i++) {
      for (let j = 0; j < existingIndexes.length; j++) {
        if (i !== j) {
          const idxA = existingIndexes[i];
          const idxB = existingIndexes[j];

          if (
            !idxA.isUnique &&
            !idxB.isUnique &&
            idxA.columns.length < idxB.columns.length &&
            idxA.columns.every((col, k: number) => idxB.columns[k] === col)
          ) {
            recommendations.push({
              tableName: table.tableName,
              type: 'REDUNDANT_INDEX',
              columns: idxA.columns,
              reason: `Index '${idxA.name}' on (${idxA.columns.join(', ')}) is redundant because composite index '${idxB.name}' already covers it.`,
              suggestedDDL: `DROP INDEX IF EXISTS "${idxA.name}";`,
            });
          }
        }
      }
    }

    return recommendations;
  }

  public static analyzeAll(tables: Map<string, TableSchema>): Map<string, IndexRecommendation[]> {
    const allRecs = new Map<string, IndexRecommendation[]>();
    for (const [tableName, table] of tables) {
      const recs = this.analyzeTable(table);
      if (recs.length > 0) {
        allRecs.set(tableName, recs);
      }
    }
    return allRecs;
  }
}
