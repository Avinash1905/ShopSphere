/**
 * ShopSphere Database Layer - Schema Graph & Foreign Key Cycle Validator
 * Validates:
 * - Directed Acyclic Graph (DAG) for relational dependencies
 * - Detects circular foreign key references (e.g., A -> B -> C -> A)
 * - Identifies orphaned foreign key targets (references to non-existent tables or columns)
 * - Calculates topological migration sequence
 */

import { TableSchema, SchemaRegistry } from './types.js';

export interface GraphValidationResult {
  isValid: boolean;
  topologicalOrder: string[];
  circularDependencies: string[][];
  orphanedReferences: Array<{
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
  }>;
  errors: string[];
  warnings: string[];
}

export class SchemaGraphValidator {
  public static validate(tables: Map<string, TableSchema>): GraphValidationResult {
    const result: GraphValidationResult = {
      isValid: true,
      topologicalOrder: [],
      circularDependencies: [],
      orphanedReferences: [],
      errors: [],
      warnings: [],
    };

    const adjacencyList = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize graph
    for (const [tableName] of tables) {
      adjacencyList.set(tableName.toLowerCase(), new Set());
      inDegree.set(tableName.toLowerCase(), 0);
    }

    // Build dependency edges (A depends on B -> B must be created before A)
    for (const [tableName, table] of tables) {
      const srcName = tableName.toLowerCase();
      for (const fk of table.foreignKeys || []) {
        const targetTable = fk.referencedTable.toLowerCase();
        const targetColumn = fk.referencedColumn;

        // Check if target table exists
        if (!tables.has(targetTable)) {
          result.isValid = false;
          result.orphanedReferences.push({
            sourceTable: tableName,
            sourceColumn: fk.columnName,
            targetTable: fk.referencedTable,
            targetColumn,
          });
          result.errors.push(`Table '${tableName}' references non-existent table '${fk.referencedTable}'.`);
          continue;
        }

        // Check if target column exists
        const targetDef = tables.get(targetTable)!;
        const targetColExists = !!targetDef.columns[targetColumn];
        if (!targetColExists) {
          result.isValid = false;
          result.orphanedReferences.push({
            sourceTable: tableName,
            sourceColumn: fk.columnName,
            targetTable: fk.referencedTable,
            targetColumn,
          });
          result.errors.push(
            `Table '${tableName}' references non-existent column '${targetColumn}' in table '${fk.referencedTable}'.`
          );
          continue;
        }

        // Ignore self-references for DAG topological sort (e.g. category parent_id)
        if (targetTable !== srcName) {
          const targets = adjacencyList.get(targetTable);
          if (targets && !targets.has(srcName)) {
            targets.add(srcName);
            inDegree.set(srcName, (inDegree.get(srcName) || 0) + 1);
          }
        }
      }
    }

    // Kahn's Algorithm for Topological Sort
    const queue: string[] = [];
    for (const [tableName, deg] of inDegree) {
      if (deg === 0) {
        queue.push(tableName);
      }
    }

    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const neighbors = adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        const newDeg = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (order.length !== tables.size) {
      result.isValid = false;
      result.errors.push('Circular foreign key dependency cycle detected in database schema graph.');
    } else {
      result.topologicalOrder = order;
    }

    return result;
  }
}
