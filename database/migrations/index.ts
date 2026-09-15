export * from './runner.js';
export * from './001_create_auth_tables.js';
export * from './002_create_catalog_tables.js';
export * from './003_create_inventory_cart_tables.js';
export * from './004_create_order_payment_tables.js';
export * from './005_create_engagement_tables.js';
export * from './006_create_audit_tables.js';
export * from './007_create_indexes_and_constraints.js';

import { MigrationRunner } from './runner.js';
import { Migration001CreateAuthTables } from './001_create_auth_tables.js';
import { Migration002CreateCatalogTables } from './002_create_catalog_tables.js';
import { Migration003CreateInventoryCartTables } from './003_create_inventory_cart_tables.js';
import { Migration004CreateOrderPaymentTables } from './004_create_order_payment_tables.js';
import { Migration005CreateEngagementTables } from './005_create_engagement_tables.js';
import { Migration006CreateAuditTables } from './006_create_audit_tables.js';
import { Migration007CreateIndexesAndConstraints } from './007_create_indexes_and_constraints.js';

export function createDefaultMigrationRunner(dbAdapter: any): MigrationRunner {
  const runner = new MigrationRunner(dbAdapter);
  runner.register(Migration001CreateAuthTables);
  runner.register(Migration002CreateCatalogTables);
  runner.register(Migration003CreateInventoryCartTables);
  runner.register(Migration004CreateOrderPaymentTables);
  runner.register(Migration005CreateEngagementTables);
  runner.register(Migration006CreateAuditTables);
  runner.register(Migration007CreateIndexesAndConstraints);
  return runner;
}
