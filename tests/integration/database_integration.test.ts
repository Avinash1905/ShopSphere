import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import { createDefaultMigrationRunner } from '../../database/migrations/index.js';
import { createDefaultSeedRunner } from '../../database/seeds/index.js';
import { SchemaRegistry, DDLGenerator } from '../../database/schema/index.js';

describe('Database Integration Test Suite', () => {
  it('should validate all 20 domain schemas and generate valid PostgreSQL & SQLite DDL', () => {
    const schemas = SchemaRegistry.getAll();
    Assert.greaterThanOrEqual(schemas.length, 16, 'Registered domain schemas count');

    const validation = SchemaRegistry.validateAll();
    Assert.isTrue(validation.isValid, `Schema validation errors: ${validation.errors.join(', ')}`);

    const depOrder = SchemaRegistry.getDependencyOrder();
    Assert.equal(depOrder.length, schemas.length, 'Dependency resolution count matches schema count');

    const pgDDL = DDLGenerator.generateAllDDL('postgres');
    Assert.isTrue(pgDDL.includes('CREATE TABLE IF NOT EXISTS users'), 'PostgreSQL DDL generates users table');
    Assert.isTrue(pgDDL.includes('CREATE TABLE IF NOT EXISTS orders'), 'PostgreSQL DDL generates orders table');

    const sqliteDDL = DDLGenerator.generateAllDDL('sqlite');
    Assert.isTrue(sqliteDDL.includes('CREATE TABLE IF NOT EXISTS inventory'), 'SQLite DDL generates inventory table');
  });

  it('should execute full migration pipeline (up), track migration batches, and support rollback', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);

    // 1. Initial pending count (10 total registered migrations: 001 - 010)
    const pending = await runner.getPendingMigrations();
    Assert.equal(pending.length, 10, 'Pending migrations count');

    // 2. Run all migrations up
    const upRes = await runner.up();
    Assert.equal(upRes.appliedCount, 10, 'Applied migrations count');

    // 3. Verify applied migrations in history table
    const applied = await runner.getAppliedMigrations();
    Assert.equal(applied.length, 10, 'Recorded migrations in history table');
    Assert.equal(applied[0].version, '20260915000001');
    Assert.greaterThan(applied[0].checksum.length, 10, 'Migration checksum exists');

    // 4. Rollback latest batch
    const rollbackRes = await runner.rollback(1);
    Assert.equal(rollbackRes.rolledBackCount, 1, 'Rolled back 1 migration');

    const afterRollbackPending = await runner.getPendingMigrations();
    Assert.equal(afterRollbackPending.length, 1, '1 migration pending after rollback');

    // 5. Re-apply to restore full state
    const reapplyRes = await runner.up();
    Assert.equal(reapplyRes.appliedCount, 1, 'Re-applied rolled back migration');
  });

  it('should execute deterministic seed runner pipeline and populate relational graph', async () => {
    const db = new MockDatabaseAdapter();
    const migrationRunner = createDefaultMigrationRunner(db);
    await migrationRunner.up();

    const seedRunner = createDefaultSeedRunner(db, 42);
    const seedRes = await seedRunner.runAll();

    Assert.equal(seedRes.totalSeeders, 6, 'Total seeders executed');
    Assert.greaterThan(seedRes.details['roles_and_permissions'], 10, 'Seeded roles and permissions');
    Assert.greaterThan(seedRes.details['users_and_sellers'], 5, 'Seeded users and sellers');
    Assert.greaterThan(seedRes.details['catalog_and_inventory'], 10, 'Seeded catalog items');
    Assert.greaterThan(seedRes.details['orders_and_payments'], 3, 'Seeded orders and payments');
    Assert.greaterThan(seedRes.details['engagement_and_notifications'], 3, 'Seeded engagement items');
    Assert.greaterThan(seedRes.details['audit_logs'], 3, 'Seeded audit records');
  });
});
