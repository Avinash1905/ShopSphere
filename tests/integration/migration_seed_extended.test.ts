import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import { createDefaultMigrationRunner } from '../../database/migrations/index.js';
import { createDefaultSeedRunner } from '../../database/seeds/index.js';

describe('Phase 3: Extended Migration Scripts & Enterprise Seeder Graph', () => {
  it('should execute all 20 migrations and verify database views and tables exist', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);

    const pending = await runner.getPendingMigrations();
    Assert.greaterThanOrEqual(pending.length, 20, 'Expected 20 pending migrations (001 - 020)');

    const upRes = await runner.up();
    Assert.greaterThanOrEqual(upRes.appliedCount, 20, 'All 20 migrations applied');

    const applied = await runner.getAppliedMigrations();
    Assert.greaterThanOrEqual(applied.length, 20);
    Assert.equal(applied[19].version, '20260915000020');
  });

  it('should seed complete 15-seeder relational enterprise graph without referential defects', async () => {
    const db = new MockDatabaseAdapter();
    const migrationRunner = createDefaultMigrationRunner(db);
    await migrationRunner.up();

    const seedRunner = createDefaultSeedRunner(db, 1337);
    const seedRes = await seedRunner.runAll();

    Assert.greaterThanOrEqual(seedRes.totalSeeders, 15, 'Total 15 seeders executed');
    const totalRecords = Object.values(seedRes.details).reduce((sum, count) => sum + count, 0);
    Assert.greaterThan(totalRecords, 100, 'Total seeded records > 100');

    // Verify extended seeded entities exist
    const mfaRows = await db.query('SELECT * FROM user_mfa_devices');
    Assert.greaterThanOrEqual(mfaRows.length, 5, 'Seeded MFA devices');

    const kycRows = await db.query('SELECT * FROM seller_kyc_verifications');
    Assert.greaterThanOrEqual(kycRows.length, 3, 'Seeded KYC verifications');

    const attrRows = await db.query('SELECT * FROM product_attributes');
    Assert.greaterThanOrEqual(attrRows.length, 3, 'Seeded product attributes');

    const whRows = await db.query('SELECT * FROM warehouses');
    Assert.greaterThanOrEqual(whRows.length, 2, 'Seeded warehouses');

    const fulfRows = await db.query('SELECT * FROM order_fulfillments');
    Assert.greaterThanOrEqual(fulfRows.length, 3, 'Seeded order fulfillments');

    const tplRows = await db.query('SELECT * FROM notification_templates');
    Assert.greaterThanOrEqual(tplRows.length, 3, 'Seeded notification templates');

    const secRows = await db.query('SELECT * FROM security_events_ledger');
    Assert.greaterThanOrEqual(secRows.length, 3, 'Seeded security event ledger records');
  });
});
