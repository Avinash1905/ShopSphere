/**
 * ShopSphere Database Schema - Automated Schema Validator & Linter Engine
 * Validates entity consistency, primary keys, foreign key referential integrity, and index design
 */

import { TableSchema, SchemaRegistry } from './types.js';

export interface ValidationError {
  table: string;
  field?: string;
  rule: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export class SchemaValidator {
  /**
   * Validates a single table schema definition
   */
  public static validateTable(schema: TableSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    // Rule 1: Table must have a primary key
    if (!schema.primaryKey || schema.primaryKey.length === 0) {
      errors.push({
        table: schema.tableName,
        rule: 'PK_REQUIRED',
        message: `Table '${schema.tableName}' has no primary key defined.`,
        severity: 'ERROR',
      });
    }

    // Rule 2: Primary key columns must exist in columns definition
    for (const pk of schema.primaryKey) {
      if (!schema.columns[pk]) {
        errors.push({
          table: schema.tableName,
          field: pk,
          rule: 'PK_COLUMN_MISSING',
          message: `Primary key column '${pk}' is not defined in columns.`,
          severity: 'ERROR',
        });
      }
    }

    // Rule 3: Check columns configuration
    for (const [colName, colDef] of Object.entries(schema.columns)) {
      if (colDef.name !== colName) {
        errors.push({
          table: schema.tableName,
          field: colName,
          rule: 'COLUMN_NAME_MISMATCH',
          message: `Column map key '${colName}' does not match definition name '${colDef.name}'.`,
          severity: 'ERROR',
        });
      }
    }

    // Rule 4: Check indexes reference existing columns
    for (const idx of schema.indexes) {
      for (const col of idx.columns) {
        if (!schema.columns[col]) {
          errors.push({
            table: schema.tableName,
            field: col,
            rule: 'INDEX_COLUMN_MISSING',
            message: `Index '${idx.name}' references non-existent column '${col}'.`,
            severity: 'ERROR',
          });
        }
      }
    }

    // Rule 5: Check foreign keys reference existing local columns
    for (const fk of schema.foreignKeys) {
      if (!schema.columns[fk.columnName]) {
        errors.push({
          table: schema.tableName,
          field: fk.columnName,
          rule: 'FK_LOCAL_COLUMN_MISSING',
          message: `Foreign key references non-existent local column '${fk.columnName}'.`,
          severity: 'ERROR',
        });
      }
    }

    return errors;
  }

  /**
   * Validates cross-table referential integrity across all registered schemas
   */
  public static validateAll(): { valid: boolean; errors: ValidationError[] } {
    const allSchemas = SchemaRegistry.getAll();
    const errors: ValidationError[] = [];
    const schemaMap = new Map<string, TableSchema>();

    for (const schema of allSchemas) {
      schemaMap.set(schema.tableName, schema);
      const tableErrors = this.validateTable(schema);
      errors.push(...tableErrors);
    }

    // Cross-table checks (Foreign keys target table & target column exist)
    for (const schema of allSchemas) {
      for (const fk of schema.foreignKeys) {
        const targetTable = schemaMap.get(fk.referencedTable);
        if (!targetTable) {
          errors.push({
            table: schema.tableName,
            field: fk.columnName,
            rule: 'FK_TARGET_TABLE_MISSING',
            message: `Foreign key '${fk.columnName}' references non-existent table '${fk.referencedTable}'.`,
            severity: 'ERROR',
          });
        } else {
          if (!targetTable.columns[fk.referencedColumn]) {
            errors.push({
              table: schema.tableName,
              field: fk.columnName,
              rule: 'FK_TARGET_COLUMN_MISSING',
              message: `Foreign key '${fk.columnName}' references non-existent column '${fk.referencedColumn}' in table '${fk.referencedTable}'.`,
              severity: 'ERROR',
            });
          }
        }
      }
    }

    return {
      valid: errors.filter(e => e.severity === 'ERROR').length === 0,
      errors,
    };
  }
}
