/**
 * Test Suite: Advanced Repositories, Queries & Seeds Integration Test
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import { PessimisticLockManager } from '../../database/repositories/pessimistic_lock_manager.js';
import { NestedSavepointManager } from '../../database/repositories/nested_savepoint_manager.js';
import { BulkOperationsEngine } from '../../database/repositories/bulk_operations_engine.js';
import { RepositoryCacheDecorator } from '../../database/repositories/repository_cache_decorator.js';
import { CriteriaBuilder } from '../../database/repositories/criteria_builder.js';
import { SoftDeleteManager } from '../../database/repositories/soft_delete_manager.js';
import { QueryPlanAnalyzer } from '../../database/queries/query_plan_analyzer.js';
import { CursorPaginationEngine } from '../../database/queries/cursor_pagination_engine.js';
import { FakerPRNGUtils } from '../../database/seeds/faker_prng_utils.js';
import { SeedScenarioGenerator } from '../../database/seeds/seed_scenarios.js';

describe('Advanced Repositories, Queries & Seeds Test Suite', () => {
  it('should manage pessimistic locks and handle contention with retries', async () => {
    const clause = PessimisticLockManager.generateLockClause('postgres', 'EXCLUSIVE_UPDATE');
    Assert.equal(clause, 'FOR UPDATE');

    let counter = 0;
    const res = await PessimisticLockManager.withLock(
      'product:123',
      'tx-1',
      async () => {
        counter += 10;
        return counter;
      },
      { timeoutMs: 1000 }
    );

    Assert.equal(res, 10);
  });

  it('should support nested savepoints with partial rollback', async () => {
    const db = new MockDatabaseAdapter();
    const spManager = new NestedSavepointManager(db);

    const sp1 = await spManager.createSavepoint('outer');
    Assert.equal(spManager.getDepth(), 1);

    await spManager.withinSavepoint(async () => {
      Assert.equal(spManager.getDepth(), 2);
    }, 'inner');

    Assert.equal(spManager.getDepth(), 1);
    await spManager.releaseSavepoint(sp1);
    Assert.equal(spManager.getDepth(), 0);
  });

  it('should generate high-performance bulk insert and bulk upsert SQL', () => {
    const records = [
      { id: '1', name: 'Alpha', price: 10 },
      { id: '2', name: 'Beta', price: 20 },
    ];

    const bulk = BulkOperationsEngine.generateBulkInsertSQL('products', records, {
      onConflict: 'DO_UPDATE',
      conflictKeys: ['id'],
      updateColumns: ['name', 'price'],
    });

    Assert.isTrue(bulk.sql.includes('INSERT INTO products (id, name, price) VALUES'));
    Assert.isTrue(bulk.sql.includes('ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price'));
    Assert.equal(bulk.params.length, 6);
  });

  it('should cache repository queries with tag-based invalidation', async () => {
    RepositoryCacheDecorator.clear();

    let dbCalls = 0;
    const fetchFn = async () => {
      dbCalls++;
      return { id: 'p1', title: 'Wireless Keyboard' };
    };

    // First call: Cache miss
    const val1 = await RepositoryCacheDecorator.getOrSet('product:p1', fetchFn, 5000, ['products', 'seller:s1']);
    Assert.equal(val1.title, 'Wireless Keyboard');
    Assert.equal(dbCalls, 1);

    // Second call: Cache hit
    const val2 = await RepositoryCacheDecorator.getOrSet('product:p1', fetchFn, 5000, ['products', 'seller:s1']);
    Assert.equal(val2.title, 'Wireless Keyboard');
    Assert.equal(dbCalls, 1);

    // Tag invalidation
    const evicted = RepositoryCacheDecorator.invalidateTags(['seller:s1']);
    Assert.equal(evicted, 1);

    // Third call after eviction: Cache miss
    await RepositoryCacheDecorator.getOrSet('product:p1', fetchFn, 5000, ['products']);
    Assert.equal(dbCalls, 2);
  });

  it('should build criteria queries with fluent AST predicates', () => {
    const query = CriteriaBuilder.where('status')
      .eq('ACTIVE')
      .and('price')
      .between(10, 100)
      .and('category_id')
      .in(['c1', 'c2'])
      .and('deleted_at')
      .isNull();

    const built = query.buildSQL();
    Assert.isTrue(built.whereSql.includes('"status" = ?'));
    Assert.isTrue(built.whereSql.includes('"price" BETWEEN ? AND ?'));
    Assert.isTrue(built.whereSql.includes('"category_id" IN (?, ?)'));
    Assert.isTrue(built.whereSql.includes('"deleted_at" IS NULL'));
    Assert.equal(built.params.length, 5);
  });

  it('should manage soft deletion lifecycle and purge expired records', () => {
    const softDel = SoftDeleteManager.generateSoftDeleteSQL('products');
    Assert.isTrue(softDel.sql.includes('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'));

    const filteredWhere = SoftDeleteManager.applySoftDeleteFilter('WHERE price > 50', 'p');
    Assert.equal(filteredWhere, 'WHERE (price > 50) AND "p".deleted_at IS NULL');

    const cutoff = new Date('2026-01-01');
    const purge = SoftDeleteManager.generatePurgeExpiredSQL('products', cutoff);
    Assert.isTrue(purge.sql.includes('DELETE FROM products WHERE deleted_at IS NOT NULL AND deleted_at < ?'));
  });

  it('should analyze SQL execution plans and flag performance bottlenecks', () => {
    const badSql = "SELECT * FROM users, orders WHERE UPPER(name) = 'ALICE' AND email LIKE '%gmail.com'";
    const analysis = QueryPlanAnalyzer.analyze(badSql);

    Assert.isFalse(analysis.isOptimal);
    Assert.isTrue(analysis.issues.some((i) => i.type === 'SELECT_STAR_OVERHEAD'));
    Assert.isTrue(analysis.issues.some((i) => i.type === 'NON_SARGABLE_PREDICATE'));
    Assert.isTrue(analysis.issues.some((i) => i.type === 'UNINDEXED_SEQ_SCAN'));
    Assert.greaterThan(analysis.estimatedCostScore, 50);
  });

  it('should encode/decode keyset cursors and generate bidirectional pagination', () => {
    const cursor = CursorPaginationEngine.encodeCursor({
      id: 'item-99',
      orderValue: '2026-09-15T12:00:00Z',
      direction: 'next',
    });
    Assert.isTrue(cursor.length > 10);

    const decoded = CursorPaginationEngine.decodeCursor(cursor);
    Assert.equal(decoded.id, 'item-99');
    Assert.equal(decoded.orderValue, '2026-09-15T12:00:00Z');

    const sqlBuilt = CursorPaginationEngine.buildCursorSQL('orders', {
      limit: 10,
      cursor,
      orderField: 'created_at',
      orderDirection: 'DESC',
    });

    Assert.isTrue(sqlBuilt.whereClause.includes('("created_at" < ? OR ("created_at" = ? AND "id" < ?))'));
    Assert.isTrue(sqlBuilt.limitClause.includes('LIMIT 11'));
  });

  it('should generate deterministic synthetic scenarios for flash sales', () => {
    const faker = new FakerPRNGUtils(42);
    const email = faker.nextEmail('John', 'Doe');
    Assert.isTrue(email.startsWith('john.doe'));

    const scenario = SeedScenarioGenerator.generateFlashSaleScenario(50, 10);
    Assert.equal(scenario.buyers.length, 50);
    Assert.equal(scenario.orders.length, 50);
    Assert.equal(scenario.hotProduct.initialStock, 10);
  });
});
