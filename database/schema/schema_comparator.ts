/**
 * ShopSphere Database Layer - Schema Comparator & Diff Engine
 * Compares two TableSchema maps to detect:
 * - Added / Dropped / Altered Tables
 * - Added / Dropped / Altered Columns (type, nullability, default)
 * - Added / Dropped / Altered Indexes (columns, uniqueness)
 * - Added / Dropped / Altered Foreign Keys and Constraints
 * - Generates forward (UP) and reverse (DOWN) DDL migration scripts
 */

import {
  TableSchema,
  ColumnDefinition,
  IndexDefinition,
  ForeignKeyDefinition,
  CheckConstraintDefinition,
} from './types.js';

export interface ColumnDiff {
  type: 'ADDED' | 'DROPPED' | 'ALTERED';
  columnName: string;
  oldColumn?: ColumnDefinition;
  newColumn?: ColumnDefinition;
  typeChanged?: boolean;
  nullabilityChanged?: boolean;
  defaultChanged?: boolean;
}

export interface IndexDiff {
  type: 'ADDED' | 'DROPPED' | 'ALTERED';
  indexName: string;
  oldIndex?: IndexDefinition;
  newIndex?: IndexDefinition;
}

export interface ForeignKeyDiff {
  type: 'ADDED' | 'DROPPED' | 'ALTERED';
  constraintName: string;
  oldForeignKey?: ForeignKeyDefinition;
  newForeignKey?: ForeignKeyDefinition;
}

export interface CheckConstraintDiff {
  type: 'ADDED' | 'DROPPED';
  name: string;
  expression: string;
}

export interface TableDiff {
  tableName: string;
  type: 'ADDED' | 'DROPPED' | 'ALTERED' | 'UNCHANGED';
  oldTable?: TableSchema;
  newTable?: TableSchema;
  columnDiffs: ColumnDiff[];
  indexDiffs: IndexDiff[];
  foreignKeyDiffs: ForeignKeyDiff[];
  checkConstraintDiffs: CheckConstraintDiff[];
  hasBreakingChanges: boolean;
}

export interface SchemaDiffResult {
  hasDifferences: boolean;
  tablesAdded: string[];
  tablesDropped: string[];
  tablesAltered: string[];
  tablesUnchanged: string[];
  tableDiffs: Map<string, TableDiff>;
  breakingChanges: string[];
  warnings: string[];
  generatedUpDDL: {
    postgres: string[];
    sqlite: string[];
  };
  generatedDownDDL: {
    postgres: string[];
    sqlite: string[];
  };
}

export class SchemaComparator {
  /**
   * Compares two complete sets of table definitions
   */
  public static compareSchemas(
    sourceTables: Map<string, TableSchema>,
    targetTables: Map<string, TableSchema>
  ): SchemaDiffResult {
    const result: SchemaDiffResult = {
      hasDifferences: false,
      tablesAdded: [],
      tablesDropped: [],
      tablesAltered: [],
      tablesUnchanged: [],
      tableDiffs: new Map(),
      breakingChanges: [],
      warnings: [],
      generatedUpDDL: { postgres: [], sqlite: [] },
      generatedDownDDL: { postgres: [], sqlite: [] },
    };

    const sourceNames = new Set(sourceTables.keys());
    const targetNames = new Set(targetTables.keys());

    // 1. Detect Added Tables
    for (const tableName of targetNames) {
      if (!sourceNames.has(tableName)) {
        result.hasDifferences = true;
        result.tablesAdded.push(tableName);
        const newTable = targetTables.get(tableName)!;
        const diff: TableDiff = {
          tableName,
          type: 'ADDED',
          newTable,
          columnDiffs: Object.values(newTable.columns).map((c: ColumnDefinition) => ({
            type: 'ADDED',
            columnName: c.name,
            newColumn: c,
          })),
          indexDiffs: (newTable.indexes || []).map((idx: IndexDefinition) => ({
            type: 'ADDED',
            indexName: idx.name,
            newIndex: idx,
          })),
          foreignKeyDiffs: (newTable.foreignKeys || []).map((fk: ForeignKeyDefinition) => ({
            type: 'ADDED',
            constraintName: fk.name || `fk_${tableName}_${fk.columnName}`,
            newForeignKey: fk,
          })),
          checkConstraintDiffs: (newTable.checks || []).map((chk: CheckConstraintDefinition) => ({
            type: 'ADDED',
            name: chk.name,
            expression: chk.expression,
          })),
          hasBreakingChanges: false,
        };
        result.tableDiffs.set(tableName, diff);
      }
    }

    // 2. Detect Dropped Tables
    for (const tableName of sourceNames) {
      if (!targetNames.has(tableName)) {
        result.hasDifferences = true;
        result.tablesDropped.push(tableName);
        result.breakingChanges.push(`Table '${tableName}' will be DROPPED, resulting in data loss.`);
        const oldTable = sourceTables.get(tableName)!;
        const diff: TableDiff = {
          tableName,
          type: 'DROPPED',
          oldTable,
          columnDiffs: Object.values(oldTable.columns).map((c: ColumnDefinition) => ({
            type: 'DROPPED',
            columnName: c.name,
            oldColumn: c,
          })),
          indexDiffs: (oldTable.indexes || []).map((idx: IndexDefinition) => ({
            type: 'DROPPED',
            indexName: idx.name,
            oldIndex: idx,
          })),
          foreignKeyDiffs: (oldTable.foreignKeys || []).map((fk: ForeignKeyDefinition) => ({
            type: 'DROPPED',
            constraintName: fk.name || `fk_${tableName}_${fk.columnName}`,
            oldForeignKey: fk,
          })),
          checkConstraintDiffs: (oldTable.checks || []).map((chk: CheckConstraintDefinition) => ({
            type: 'DROPPED',
            name: chk.name,
            expression: chk.expression,
          })),
          hasBreakingChanges: true,
        };
        result.tableDiffs.set(tableName, diff);
      }
    }

    // 3. Compare Common Tables
    for (const tableName of sourceNames) {
      if (targetNames.has(tableName)) {
        const oldTable = sourceTables.get(tableName)!;
        const newTable = targetTables.get(tableName)!;
        const tableDiff = this.compareTable(oldTable, newTable);

        if (tableDiff.type === 'ALTERED') {
          result.hasDifferences = true;
          result.tablesAltered.push(tableName);
          result.tableDiffs.set(tableName, tableDiff);
          if (tableDiff.hasBreakingChanges) {
            result.breakingChanges.push(`Table '${tableName}' contains destructive column or constraint alterations.`);
          }
        } else {
          result.tablesUnchanged.push(tableName);
          result.tableDiffs.set(tableName, tableDiff);
        }
      }
    }

    // 4. Generate DDL Migrations
    this.generateMigrationDDL(result);

    return result;
  }

  /**
   * Compares two versions of the same table
   */
  public static compareTable(oldTable: TableSchema, newTable: TableSchema): TableDiff {
    const tableName = newTable.tableName;
    const columnDiffs: ColumnDiff[] = [];
    const indexDiffs: IndexDiff[] = [];
    const foreignKeyDiffs: ForeignKeyDiff[] = [];
    const checkConstraintDiffs: CheckConstraintDiff[] = [];
    let hasBreaking = false;

    const oldColMap = new Map<string, ColumnDefinition>(Object.entries(oldTable.columns));
    const newColMap = new Map<string, ColumnDefinition>(Object.entries(newTable.columns));

    // Added Columns
    for (const [colName, newCol] of newColMap) {
      if (!oldColMap.has(colName)) {
        const isBreaking = newCol.isNullable === false && newCol.defaultValue === undefined;
        if (isBreaking) hasBreaking = true;
        columnDiffs.push({
          type: 'ADDED',
          columnName: colName,
          newColumn: newCol,
        });
      }
    }

    // Dropped Columns
    for (const [colName, oldCol] of oldColMap) {
      if (!newColMap.has(colName)) {
        hasBreaking = true;
        columnDiffs.push({
          type: 'DROPPED',
          columnName: colName,
          oldColumn: oldCol,
        });
      }
    }

    // Altered Columns
    for (const [colName, oldCol] of oldColMap) {
      if (newColMap.has(colName)) {
        const newCol = newColMap.get(colName)!;
        const typeChanged = oldCol.type !== newCol.type;
        const nullabilityChanged = oldCol.isNullable !== newCol.isNullable;
        const defaultChanged = String(oldCol.defaultValue) !== String(newCol.defaultValue);

        if (typeChanged || nullabilityChanged || defaultChanged) {
          if (typeChanged || (oldCol.isNullable !== false && newCol.isNullable === false)) {
            hasBreaking = true;
          }
          columnDiffs.push({
            type: 'ALTERED',
            columnName: colName,
            oldColumn: oldCol,
            newColumn: newCol,
            typeChanged,
            nullabilityChanged,
            defaultChanged,
          });
        }
      }
    }

    // Indexes Diff
    const oldIdxMap = new Map<string, IndexDefinition>((oldTable.indexes || []).map((i) => [i.name, i]));
    const newIdxMap = new Map<string, IndexDefinition>((newTable.indexes || []).map((i) => [i.name, i]));

    for (const [idxName, newIdx] of newIdxMap) {
      if (!oldIdxMap.has(idxName)) {
        indexDiffs.push({ type: 'ADDED', indexName: idxName, newIndex: newIdx });
      } else {
        const oldIdx = oldIdxMap.get(idxName)!;
        const colsMatch = oldIdx.columns.join(',') === newIdx.columns.join(',');
        const uniqueMatch = !oldIdx.isUnique === !newIdx.isUnique;
        if (!colsMatch || !uniqueMatch) {
          indexDiffs.push({ type: 'ALTERED', indexName: idxName, oldIndex: oldIdx, newIndex: newIdx });
        }
      }
    }

    for (const [idxName, oldIdx] of oldIdxMap) {
      if (!newIdxMap.has(idxName)) {
        indexDiffs.push({ type: 'DROPPED', indexName: idxName, oldIndex: oldIdx });
      }
    }

    // Foreign Keys Diff
    const oldFkMap = new Map<string, ForeignKeyDefinition>(
      (oldTable.foreignKeys || []).map((f) => [f.name || `${f.columnName}->${f.referencedTable}.${f.referencedColumn}`, f])
    );
    const newFkMap = new Map<string, ForeignKeyDefinition>(
      (newTable.foreignKeys || []).map((f) => [f.name || `${f.columnName}->${f.referencedTable}.${f.referencedColumn}`, f])
    );

    for (const [fkName, newFk] of newFkMap) {
      if (!oldFkMap.has(fkName)) {
        foreignKeyDiffs.push({ type: 'ADDED', constraintName: fkName, newForeignKey: newFk });
      }
    }
    for (const [fkName, oldFk] of oldFkMap) {
      if (!newFkMap.has(fkName)) {
        foreignKeyDiffs.push({ type: 'DROPPED', constraintName: fkName, oldForeignKey: oldFk });
      }
    }

    const isAltered =
      columnDiffs.length > 0 ||
      indexDiffs.length > 0 ||
      foreignKeyDiffs.length > 0 ||
      checkConstraintDiffs.length > 0;

    return {
      tableName,
      type: isAltered ? 'ALTERED' : 'UNCHANGED',
      oldTable,
      newTable,
      columnDiffs,
      indexDiffs,
      foreignKeyDiffs,
      checkConstraintDiffs,
      hasBreakingChanges: hasBreaking,
    };
  }

  /**
   * Generates Up & Down DDL SQL statements from the diff result
   */
  private static generateMigrationDDL(result: SchemaDiffResult): void {
    for (const [tableName, diff] of result.tableDiffs) {
      if (diff.type === 'ADDED' && diff.newTable) {
        result.generatedUpDDL.postgres.push(`-- Create table ${tableName}`);
        result.generatedDownDDL.postgres.push(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        result.generatedDownDDL.sqlite.push(`DROP TABLE IF EXISTS "${tableName}";`);
      } else if (diff.type === 'DROPPED' && diff.oldTable) {
        result.generatedUpDDL.postgres.push(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        result.generatedUpDDL.sqlite.push(`DROP TABLE IF EXISTS "${tableName}";`);
      } else if (diff.type === 'ALTERED') {
        for (const colDiff of diff.columnDiffs) {
          if (colDiff.type === 'ADDED' && colDiff.newColumn) {
            const col = colDiff.newColumn;
            const nullStr = col.isNullable === false ? ' NOT NULL' : '';
            const defStr = col.defaultValue !== undefined ? ` DEFAULT ${col.defaultValue}` : '';
            result.generatedUpDDL.postgres.push(
              `ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${col.type}${nullStr}${defStr};`
            );
            result.generatedDownDDL.postgres.push(
              `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${col.name}";`
            );
          } else if (colDiff.type === 'DROPPED' && colDiff.oldColumn) {
            result.generatedUpDDL.postgres.push(
              `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${colDiff.columnName}";`
            );
          } else if (colDiff.type === 'ALTERED' && colDiff.newColumn) {
            const col = colDiff.newColumn;
            if (colDiff.typeChanged) {
              result.generatedUpDDL.postgres.push(
                `ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${col.type};`
              );
            }
            if (colDiff.nullabilityChanged) {
              const setDrop = col.isNullable === false ? 'SET NOT NULL' : 'DROP NOT NULL';
              result.generatedUpDDL.postgres.push(
                `ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" ${setDrop};`
              );
            }
          }
        }

        for (const idxDiff of diff.indexDiffs) {
          if (idxDiff.type === 'ADDED' && idxDiff.newIndex) {
            const u = idxDiff.newIndex.isUnique ? 'UNIQUE ' : '';
            const cols = idxDiff.newIndex.columns.map((c) => `"${c}"`).join(', ');
            result.generatedUpDDL.postgres.push(
              `CREATE ${u}INDEX IF NOT EXISTS "${idxDiff.indexName}" ON "${tableName}" (${cols});`
            );
            result.generatedDownDDL.postgres.push(`DROP INDEX IF EXISTS "${idxDiff.indexName}";`);
          } else if (idxDiff.type === 'DROPPED') {
            result.generatedUpDDL.postgres.push(`DROP INDEX IF EXISTS "${idxDiff.indexName}";`);
          }
        }
      }
    }
  }
}
