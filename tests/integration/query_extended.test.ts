import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import { createDefaultMigrationRunner } from '../../database/migrations/index.js';
import { createDefaultSeedRunner } from '../../database/seeds/index.js';
import {
  FinancialReconciliationQueryEngine,
  SellerPayoutLedgerQueryEngine,
  CartAbandonmentFunnelQueryEngine,
  HierarchicalCategoryQueryEngine,
  PredictiveReorderInventoryQueryEngine,
  DistributedOrderRoutingQueryEngine,
  FraudPatternDetectionQueryEngine,
  CustomerLifetimeValueQueryEngine,
  TemporalAuditDiffQueryEngine,
  QueryASTRewriter,
} from '../../database/queries/index.js';

describe('Phase 4: Complex Query Engines & Enterprise AST Rewriter', () => {
  async function setupSeededDb(): Promise<MockDatabaseAdapter> {
    const db = new MockDatabaseAdapter();
    const migrationRunner = createDefaultMigrationRunner(db);
    await migrationRunner.up();
    const seedRunner = createDefaultSeedRunner(db, 42);
    await seedRunner.runAll();
    return db;
  }

  it('should execute financial reconciliation query and calculate double-entry ledger metrics', async () => {
    const db = await setupSeededDb();
    const engine = new FinancialReconciliationQueryEngine(db);

    const report = await engine.reconcilePeriod('2026-01-01', '2026-12-31');
    Assert.greaterThan(report.totalOrders, 0, 'Reconciliation should analyze orders');
    Assert.greaterThanOrEqual(report.reconciliationRatePercent, 0, 'Reconciliation rate calculated');
    Assert.isTrue(report.totalCapturedGmv >= 0);

    const settlementBatches = await engine.generateSellerSettlementBatches({
      cutoffDate: '2026-12-31',
      minimumPayoutAmount: 10,
    });
    Assert.isTrue(Array.isArray(settlementBatches), 'Settlement batches generated');
  });

  it('should calculate seller tier, compile payout ledger, and generate audit entries', async () => {
    const db = await setupSeededDb();
    const engine = new SellerPayoutLedgerQueryEngine(db);

    const sellers = await db.query<any>('SELECT id FROM sellers LIMIT 1');
    const sellerId = sellers[0]?.id || 'seller_1';

    const tier = await engine.getSellerTier(sellerId);
    Assert.isTrue(['PLATINUM', 'GOLD', 'SILVER', 'STANDARD'].includes(tier.tierName));

    const ledger = await engine.compilePayoutLedger(sellerId, '2026-01-01', '2026-12-31');
    Assert.equal(ledger.sellerId, sellerId);
    Assert.greaterThanOrEqual(ledger.grossMerchandiseValue, 0);

    const auditEntries = engine.generateAuditEntries(ledger);
    Assert.equal(auditEntries.length, 4, 'Four double-entry audit legs generated');
    Assert.equal(auditEntries[0].accountType, 'ESCROW');
    Assert.equal(auditEntries[1].accountType, 'COMMISSION');
  });

  it('should analyze cart abandonment funnel stages and prioritize high-recovery carts', async () => {
    const db = await setupSeededDb();
    const engine = new CartAbandonmentFunnelQueryEngine(db);

    const funnel = await engine.analyzeFunnel(60);
    Assert.equal(funnel.stages.length, 5, 'Five stages in checkout conversion funnel');
    Assert.equal(funnel.stages[0].stage, 'CART_CREATED');
    Assert.equal(funnel.stages[4].stage, 'ORDER_COMPLETED');
    Assert.greaterThanOrEqual(funnel.overallConversionRate, 0);
  });

  it('should traverse hierarchical categories, build breadcrumbs, and detect cyclic graphs', async () => {
    const db = await setupSeededDb();
    const engine = new HierarchicalCategoryQueryEngine(db);

    const tree = await engine.getCategoryHierarchyTree();
    Assert.greaterThan(tree.length, 0, 'Category tree built');

    const breadcrumbs = await engine.getBreadcrumbs(tree[0].id);
    Assert.greaterThan(breadcrumbs.length, 0, 'Breadcrumbs resolved');
    Assert.equal(breadcrumbs[0].id, tree[0].id);

    const isSafe = await engine.validateHierarchyCycle(tree[0].id, null);
    Assert.isTrue(isSafe, 'Moving to root is safe');

    const isCycle = await engine.validateHierarchyCycle(tree[0].id, tree[0].id);
    Assert.isFalse(isCycle, 'Self-parenting detected as cycle');
  });

  it('should calculate predictive reorder points and detect stockout urgency', async () => {
    const db = await setupSeededDb();
    const engine = new PredictiveReorderInventoryQueryEngine(db);

    const audit = await engine.analyzeReorderNeeds();
    Assert.greaterThan(audit.totalSkusAudited, 0, 'Inventory SKUs audited');
    Assert.isTrue(audit.recommendations.length > 0, 'Recommendations generated');
    Assert.isTrue(['CRITICAL_STOCKOUT', 'LOW_STOCK', 'HEALTHY', 'OVERSTOCKED', 'DEAD_STOCK'].includes(audit.recommendations[0].stockStatus));
  });

  it('should compute multi-warehouse order fulfillment routing and minimize split shipments', async () => {
    const db = await setupSeededDb();
    const engine = new DistributedOrderRoutingQueryEngine(db);

    const orders = await db.query<any>('SELECT id FROM orders LIMIT 1');
    const orderId = orders[0]?.id || 'ord_test';

    const routePlan = await engine.computeOptimalRoute(orderId, 37.7749, -122.4194, '94105');
    Assert.equal(routePlan.orderId, orderId);
    Assert.greaterThanOrEqual(routePlan.totalShipments, 0);
    Assert.greaterThanOrEqual(routePlan.maxTransitDays, 0);
  });

  it('should evaluate multi-signal fraud risks and recommend appropriate defense actions', async () => {
    const db = await setupSeededDb();
    const engine = new FraudPatternDetectionQueryEngine(db);

    const users = await db.query<any>('SELECT id FROM users LIMIT 1');
    const userId = users[0]?.id || 'user_1';

    const evaluation = await engine.evaluateTransactionRisk(userId);
    Assert.equal(evaluation.userId, userId);
    Assert.greaterThanOrEqual(evaluation.riskScore, 0);
    Assert.isTrue(['ALLOW', 'CHALLENGE_MFA', 'MANUAL_REVIEW', 'AUTO_DECLINE'].includes(evaluation.recommendedAction));
  });

  it('should compute RFM customer profiles and monthly cohort retention matrices', async () => {
    const db = await setupSeededDb();
    const engine = new CustomerLifetimeValueQueryEngine(db);

    const overview = await engine.analyzeCustomerPortfolio();
    Assert.greaterThanOrEqual(overview.totalCustomers, 0);
    Assert.isTrue(Array.isArray(overview.profiles));

    const cohorts = await engine.computeMonthlyCohortRetention();
    Assert.greaterThan(cohorts.length, 0, 'Cohorts computed');
    Assert.equal(cohorts[0].retentionByMonth.length, 6, '6-month cohort retention tracked');
  });

  it('should compute temporal audit diffs and reconstruct point-in-time entity state', async () => {
    const db = await setupSeededDb();
    const engine = new TemporalAuditDiffQueryEngine(db);

    const diffs = engine.computeStateDiff(
      { name: 'Old Name', price: 100 },
      { name: 'New Name', price: 100, tag: 'sale' }
    );
    Assert.equal(diffs.length, 2, '2 delta changes detected');
    Assert.equal(diffs.find((d) => d.fieldName === 'name')?.changeType, 'MODIFIED');
    Assert.equal(diffs.find((d) => d.fieldName === 'tag')?.changeType, 'ADDED');

    const timeline = await engine.getEntityTimeline('product', 'prod_1');
    Assert.equal(timeline.entityType, 'product');
  });

  it('should parse and rewrite SQL queries with tenant isolation, soft-delete, and index hints', () => {
    const originalSQL = 'SELECT id, title, price FROM products WHERE status = "PUBLISHED" ORDER BY price ASC';
    
    const rewritten = QueryASTRewriter.rewrite(originalSQL, {
      enforceTenantIsolation: true,
      tenantId: 'tenant_enterprise_1',
      injectSoftDeleteFilter: true,
      forceIndexNames: ['idx_prod_tenant_status'],
      maxLimitCap: 50,
    });

    Assert.isTrue(rewritten.rewrittenSQL.includes("tenant_id = 'tenant_enterprise_1'"), 'Tenant isolation injected');
    Assert.isTrue(rewritten.rewrittenSQL.includes('deleted_at IS NULL'), 'Soft-delete filter injected');
    Assert.isTrue(rewritten.rewrittenSQL.includes('FORCE INDEX (idx_prod_tenant_status)'), 'Index hint injected');
    Assert.isTrue(rewritten.rewrittenSQL.includes('LIMIT 50'), 'Max limit cap injected');

    const pruning = QueryASTRewriter.extractPartitionPruningTargets("SELECT * FROM audit_logs WHERE created_at >= '2026-09-15'");
    Assert.isTrue(pruning.prunable);
    Assert.isTrue(pruning.targetPartitions.includes('p_2026_09'));
  });
});
