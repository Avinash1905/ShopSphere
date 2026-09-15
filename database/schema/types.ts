/**
 * ShopSphere Database Schema Definition Types
 * Provides metadata interfaces, column descriptors, constraints, relations, and table blueprints.
 */

export type ColumnType =
  | 'UUID'
  | 'VARCHAR'
  | 'TEXT'
  | 'INTEGER'
  | 'BIGINT'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'TIMESTAMP'
  | 'DATE'
  | 'JSON'
  | 'JSONB'
  | 'ARRAY';

export type ForeignKeyAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  length?: number;
  precision?: number;
  scale?: number;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: any;
  checkConstraint?: string;
  description?: string;
  isIndexed?: boolean;
}

export interface ForeignKeyDefinition {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: ForeignKeyAction;
  onUpdate?: ForeignKeyAction;
  name?: string;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  isUnique?: boolean;
  indexType?: 'BTREE' | 'HASH' | 'GIN' | 'GIST';
  wherePredicate?: string;
}

export interface CheckConstraintDefinition {
  name: string;
  expression: string;
}

export interface RelationshipDefinition {
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  targetTable: string;
  foreignKey: string;
  inverseForeignKey?: string;
  junctionTable?: string;
}

export interface TableSchema {
  tableName: string;
  description: string;
  columns: Record<string, ColumnDefinition>;
  primaryKey: string[];
  foreignKeys: ForeignKeyDefinition[];
  indexes: IndexDefinition[];
  checks: CheckConstraintDefinition[];
  relationships: Record<string, RelationshipDefinition>;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SchemaRegistry {
  private static schemas: Map<string, TableSchema> = new Map();

  public static register(schema: TableSchema): void {
    this.schemas.set(schema.tableName.toLowerCase(), schema);
  }

  public static get(tableName: string): TableSchema | undefined {
    return this.schemas.get(tableName.toLowerCase());
  }

  public static getAll(): TableSchema[] {
    return Array.from(this.schemas.values());
  }

  public static getDependencyOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (name: string, ancestors: Set<string>) => {
      if (visited.has(name)) return;
      if (ancestors.has(name)) {
        throw new Error(`Cyclic dependency detected in database schema involving table '${name}'`);
      }

      ancestors.add(name);
      const schema = this.schemas.get(name);
      if (schema) {
        for (const fk of schema.foreignKeys) {
          const ref = fk.referencedTable.toLowerCase();
          if (ref !== name && this.schemas.has(ref)) {
            visit(ref, new Set(ancestors));
          }
        }
      }
      ancestors.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const tableName of this.schemas.keys()) {
      if (!visited.has(tableName)) {
        visit(tableName, new Set());
      }
    }

    return order;
  }

  public static validateAll(): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [name, schema] of this.schemas.entries()) {
      if (!schema.primaryKey || schema.primaryKey.length === 0) {
        errors.push(`Table '${name}' does not have a primary key defined.`);
      }

      for (const pk of schema.primaryKey) {
        if (!schema.columns[pk]) {
          errors.push(`Table '${name}' primary key column '${pk}' is not defined in columns list.`);
        }
      }

      for (const fk of schema.foreignKeys) {
        if (!schema.columns[fk.columnName]) {
          errors.push(`Table '${name}' foreign key column '${fk.columnName}' does not exist.`);
        }
        const refSchema = this.schemas.get(fk.referencedTable.toLowerCase());
        if (!refSchema) {
          errors.push(`Table '${name}' references non-existent table '${fk.referencedTable}'.`);
        } else if (!refSchema.columns[fk.referencedColumn]) {
          errors.push(
            `Table '${name}' references non-existent column '${fk.referencedColumn}' in table '${fk.referencedTable}'.`
          );
        }
      }

      for (const idx of schema.indexes) {
        for (const col of idx.columns) {
          if (!schema.columns[col]) {
            errors.push(`Index '${idx.name}' on table '${name}' references non-existent column '${col}'.`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
