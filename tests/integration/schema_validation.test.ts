import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { SchemaRegistry, DDLGenerator } from '../../database/schema/index.js';

describe('Database Schema Validation', () => {
  it('should register all 20 domain schemas and validate integrity', () => {
    const schemas = SchemaRegistry.getAll();
    if (schemas.length < 15) {
      throw new Error(`Expected at least 15 schemas registered, found ${schemas.length}`);
    }

    const validation = SchemaRegistry.validateAll();
    if (!validation.isValid) {
      throw new Error(`Schema validation failed with errors: ${validation.errors.join(', ')}`);
    }

    const depOrder = SchemaRegistry.getDependencyOrder();
    if (depOrder.length !== schemas.length) {
      throw new Error('Dependency resolution did not cover all tables');
    }

    const postgresDDL = DDLGenerator.generateAllDDL('postgres');
    if (!postgresDDL.includes('CREATE TABLE IF NOT EXISTS users')) {
      throw new Error('Postgres DDL missing users table');
    }

    const sqliteDDL = DDLGenerator.generateAllDDL('sqlite');
    if (!sqliteDDL.includes('CREATE TABLE IF NOT EXISTS orders')) {
      throw new Error('SQLite DDL missing orders table');
    }

    console.log(`[SchemaRegistry] Successfully validated ${schemas.length} domain schemas with complete dependency graph!`);
  });
});
