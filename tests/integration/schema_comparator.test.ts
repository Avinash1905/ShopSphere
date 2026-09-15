/**
 * Test Suite: Advanced Schema & Migration Engine Integration Test
 */

import { TestRunner } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SchemaComparator } from '../../database/schema/schema_comparator.js';
import { SchemaGraphValidator } from '../../database/schema/schema_graph_validator.js';
import { IndexAdvisor } from '../../database/schema/index_advisor.js';
import { PartitionManager } from '../../database/schema/partition_manager.js';
import { ViewRegistry } from '../../database/schema/view_definitions.js';
import { TriggerRegistry } from '../../database/schema/trigger_definitions.js';
import { MigrationLockManager } from '../../database/migrations/migration_lock.js';
import { MigrationDryRunner } from '../../database/migrations/migration_dry_run.js';
import { MigrationSnapshotEngine } from '../../database/migrations/migration_snapshot.js';
import { TableSchema } from '../../database/schema/types.js';

TestRunner.describe('Advanced Schema & Migration Engine Test', () => {
  TestRunner.it('should calculate schema diffs, detect added/dropped/altered tables, and generate DDL', async () => {
    const tableV1: TableSchema = {
      tableName: 'customers',
      description: 'Customer table v1',
      columns: {
        id: { name: 'id', type: 'UUID', isNullable: false, isPrimary: true },
        email: { name: 'email', type: 'VARCHAR', isNullable: false },
        old_column: { name: 'old_column', type: 'TEXT', isNullable: true },
      },
      primaryKey: ['id'],
      indexes: [{ name: 'idx_customers_email', columns: ['email'], isUnique: true }],
      foreignKeys: [],
      checks: [],
      relationships: {},
    };

    const tableV2: TableSchema = {
      tableName: 'customers',
      description: 'Customer table v2',
      columns: {
        id: { name: 'id', type: 'UUID', isNullable: false, isPrimary: true },
        email: { name: 'email', type: 'VARCHAR', isNullable: false },
        tier: { name: 'tier', type: 'VARCHAR', isNullable: false, defaultValue: 'BRONZE' },
      },
      primaryKey: ['id'],
      indexes: [
        { name: 'idx_customers_email', columns: ['email'], isUnique: true },
        { name: 'idx_customers_tier', columns: ['tier'], isUnique: false },
      ],
      foreignKeys: [],
      checks: [],
      relationships: {},
    };

    const sourceMap = new Map<string, TableSchema>([['customers', tableV1]]);
    const targetMap = new Map<string, TableSchema>([['customers', tableV2]]);

    const diffResult = SchemaComparator.compareSchemas(sourceMap, targetMap);

    Assert.isTrue(diffResult.hasDifferences);
    Assert.equal(diffResult.tablesAltered.length, 1);
    Assert.equal(diffResult.tablesAltered[0], 'customers');

    const customerDiff = diffResult.tableDiffs.get('customers')!;
    Assert.equal(customerDiff.type, 'ALTERED');
    Assert.isTrue(customerDiff.columnDiffs.some((c) => c.columnName === 'tier' && c.type === 'ADDED'));
    Assert.isTrue(customerDiff.columnDiffs.some((c) => c.columnName === 'old_column' && c.type === 'DROPPED'));
    Assert.isTrue(customerDiff.indexDiffs.some((i) => i.indexName === 'idx_customers_tier' && i.type === 'ADDED'));
    Assert.isTrue(diffResult.generatedUpDDL.postgres.some((sql) => sql.includes('ADD COLUMN "tier"')));
  });

  TestRunner.it('should validate DAG foreign key relationships and detect cycles', async () => {
    const userTable: TableSchema = {
      tableName: 'users',
      description: 'Users table',
      columns: { id: { name: 'id', type: 'UUID', isNullable: false, isPrimary: true } },
      primaryKey: ['id'],
      foreignKeys: [],
      indexes: [],
      checks: [],
      relationships: {},
    };

    const orderTable: TableSchema = {
      tableName: 'orders',
      description: 'Orders table',
      columns: {
        id: { name: 'id', type: 'UUID', isNullable: false, isPrimary: true },
        user_id: { name: 'user_id', type: 'UUID', isNullable: false },
      },
      primaryKey: ['id'],
      foreignKeys: [{ columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id' }],
      indexes: [],
      checks: [],
      relationships: {},
    };

    const validTables = new Map<string, TableSchema>([
      ['users', userTable],
      ['orders', orderTable],
    ]);

    const validResult = SchemaGraphValidator.validate(validTables);
    Assert.isTrue(validResult.isValid);
    Assert.equal(validResult.topologicalOrder[0], 'users');
    Assert.equal(validResult.topologicalOrder[1], 'orders');
  });

  TestRunner.it('should advise on unindexed foreign keys and redundant composite indexes', async () => {
    const tableWithUnindexedFK: TableSchema = {
      tableName: 'order_items',
      description: 'Order items',
      columns: {
        id: { name: 'id', type: 'UUID', isNullable: false, isPrimary: true },
        product_id: { name: 'product_id', type: 'UUID', isNullable: false },
      },
      primaryKey: ['id'],
      foreignKeys: [{ columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id' }],
      indexes: [],
      checks: [],
      relationships: {},
    };

    const recs = IndexAdvisor.analyzeTable(tableWithUnindexedFK);
    Assert.equal(recs.length, 1);
    Assert.equal(recs[0].type, 'MISSING_FOREIGN_KEY_INDEX');
    Assert.isTrue(recs[0].suggestedDDL.includes('CREATE INDEX'));
  });

  TestRunner.it('should generate table partitions, views, and database triggers', async () => {
    const auditConfig = PartitionManager.getPartitionConfig('audit_logs');
    Assert.isNotNull(auditConfig);
    const partitionDDL = PartitionManager.generatePostgresPartitionDDL(auditConfig!);
    Assert.isTrue(partitionDDL.length >= 4);
    Assert.isTrue(partitionDDL[0].includes('PARTITION OF "audit_logs"'));

    const views = ViewRegistry.getAllViews();
    Assert.isTrue(views.length >= 3);
    const pgViewDDL = ViewRegistry.generateAllViewsDDL('postgres');
    Assert.isTrue(pgViewDDL[0].includes('CREATE OR REPLACE VIEW'));

    const triggers = TriggerRegistry.getAllTriggers();
    Assert.isTrue(triggers.length >= 2);
  });

  TestRunner.it('should manage distributed migration locks, safety dry-runs, and snapshots', async () => {
    // 1. Lock Management
    const lock1 = await MigrationLockManager.acquireLock('worker-1', 60);
    Assert.isTrue(lock1);
    Assert.isTrue(MigrationLockManager.isLocked());

    const lock2 = await MigrationLockManager.acquireLock('worker-2', 60);
    Assert.isFalse(lock2);

    const released = await MigrationLockManager.releaseLock('worker-1');
    Assert.isTrue(released);
    Assert.isFalse(MigrationLockManager.isLocked());

    // 2. Safety Dry-Run
    const mockDestructiveMigration = {
      id: '20260999000001',
      name: 'drop_legacy_tables',
      up: {
        postgres: ['DROP TABLE "legacy_data";', 'CREATE INDEX idx_user_name ON users (name);'],
        sqlite: ['DROP TABLE "legacy_data";'],
      },
      down: { postgres: [], sqlite: [] },
    };

    const safetyReport = MigrationDryRunner.plan([mockDestructiveMigration], 'postgres');
    Assert.isFalse(safetyReport.safeToExecute);
    Assert.equal(safetyReport.destructiveOperations.length, 1);
    Assert.equal(safetyReport.destructiveOperations[0].risk, 'DATA_LOSS');

    // 3. Schema Snapshot Checksum
    const userTable: TableSchema = {
      tableName: 'users',
      description: 'Users',
      columns: { id: { name: 'id', type: 'UUID', isNullable: false, isPrimary: true } },
      primaryKey: ['id'],
      foreignKeys: [],
      indexes: [],
      checks: [],
      relationships: {},
    };

    const tablesMap = new Map<string, TableSchema>([['users', userTable]]);

    const snap1 = MigrationSnapshotEngine.createSnapshot('v1.0.0', tablesMap);
    const snap2 = MigrationSnapshotEngine.createSnapshot('v1.0.0', tablesMap);
    Assert.isTrue(MigrationSnapshotEngine.verifyDrift(snap1, snap2));
    Assert.equal(snap1.checksum.length, 64);
  });
});
