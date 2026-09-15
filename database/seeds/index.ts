export * from './seed_runner.js';
export * from './role_permission_seeder.js';
export * from './user_seller_seeder.js';
export * from './catalog_seeder.js';
export * from './order_payment_seeder.js';
export * from './engagement_seeder.js';
export * from './audit_seeder.js';
export * from './faker_prng_utils.js';
export * from './seed_scenarios.js';

import { SeedRunner } from './seed_runner.js';
import { RolePermissionSeeder } from './role_permission_seeder.js';
import { UserSellerSeeder } from './user_seller_seeder.js';
import { CatalogSeeder } from './catalog_seeder.js';
import { OrderPaymentSeeder } from './order_payment_seeder.js';
import { EngagementSeeder } from './engagement_seeder.js';
import { AuditSeeder } from './audit_seeder.js';

export function createDefaultSeedRunner(dbAdapter: any, seed: number = 42): SeedRunner {
  const runner = new SeedRunner(dbAdapter, seed);
  runner.register(RolePermissionSeeder);
  runner.register(UserSellerSeeder);
  runner.register(CatalogSeeder);
  runner.register(OrderPaymentSeeder);
  runner.register(EngagementSeeder);
  runner.register(AuditSeeder);
  return runner;
}
