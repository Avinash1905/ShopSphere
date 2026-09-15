export * from './runner.js';
export * from './migration_lock.js';
export * from './migration_dry_run.js';
export * from './migration_snapshot.js';
export * from './001_create_auth_tables.js';
export * from './002_create_catalog_tables.js';
export * from './003_create_inventory_cart_tables.js';
export * from './004_create_order_payment_tables.js';
export * from './005_create_engagement_tables.js';
export * from './006_create_audit_tables.js';
export * from './007_create_indexes_and_constraints.js';
export * from './008_create_partitioned_tables.js';
export * from './009_create_database_views.js';
export * from './010_create_triggers.js';

import { MigrationRunner } from './runner.js';
import { Migration001CreateAuthTables } from './001_create_auth_tables.js';
import { Migration002CreateCatalogTables } from './002_create_catalog_tables.js';
import { Migration003CreateInventoryCartTables } from './003_create_inventory_cart_tables.js';
import { Migration004CreateOrderPaymentTables } from './004_create_order_payment_tables.js';
import { Migration005CreateEngagementTables } from './005_create_engagement_tables.js';
import { Migration006CreateAuditTables } from './006_create_audit_tables.js';
import { Migration007CreateIndexesAndConstraints } from './007_create_indexes_and_constraints.js';
import { Migration008CreatePartitionedTables } from './008_create_partitioned_tables.js';
import { Migration009CreateDatabaseViews } from './009_create_database_views.js';
import { Migration010CreateTriggers } from './010_create_triggers.js';

export function createDefaultMigrationRunner(dbAdapter: any): MigrationRunner {
  const runner = new MigrationRunner(dbAdapter);
  runner.register(Migration001CreateAuthTables);
  runner.register(Migration002CreateCatalogTables);
  runner.register(Migration003CreateInventoryCartTables);
  runner.register(Migration004CreateOrderPaymentTables);
  runner.register(Migration005CreateEngagementTables);
  runner.register(Migration006CreateAuditTables);
  runner.register(Migration007CreateIndexesAndConstraints);
  runner.register(Migration008CreatePartitionedTables);
  runner.register(Migration009CreateDatabaseViews);
  runner.register(Migration010CreateTriggers);
  return runner;
}
