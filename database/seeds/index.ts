export * from './seed_runner.js';
export * from './role_permission_seeder.js';
export * from './user_seller_seeder.js';
export * from './catalog_seeder.js';
export * from './order_payment_seeder.js';
export * from './engagement_seeder.js';
export * from './audit_seeder.js';
export * from './faker_prng_utils.js';
export * from './seed_scenarios.js';

// Extended Enterprise Seeders
export * from './extended_auth_seeder.js';
export * from './extended_seller_seeder.js';
export * from './extended_catalog_seeder.js';
export * from './extended_inventory_seeder.js';
export * from './extended_order_seeder.js';
export * from './extended_payment_seeder.js';
export * from './extended_engagement_seeder.js';
export * from './extended_notification_seeder.js';
export * from './extended_audit_seeder.js';
export * from './16_extended_wms_seeder.js';

import { SeedRunner } from './seed_runner.js';
import { RolePermissionSeeder } from './role_permission_seeder.js';
import { UserSellerSeeder } from './user_seller_seeder.js';
import { CatalogSeeder } from './catalog_seeder.js';
import { OrderPaymentSeeder } from './order_payment_seeder.js';
import { EngagementSeeder } from './engagement_seeder.js';
import { AuditSeeder } from './audit_seeder.js';
import { ExtendedAuthSeeder } from './extended_auth_seeder.js';
import { ExtendedSellerSeeder } from './extended_seller_seeder.js';
import { ExtendedCatalogSeeder } from './extended_catalog_seeder.js';
import { ExtendedInventorySeeder } from './extended_inventory_seeder.js';
import { ExtendedOrderSeeder } from './extended_order_seeder.js';
import { ExtendedPaymentSeeder } from './extended_payment_seeder.js';
import { ExtendedEngagementSeeder } from './extended_engagement_seeder.js';
import { ExtendedNotificationSeeder } from './extended_notification_seeder.js';
import { ExtendedAuditSeeder } from './extended_audit_seeder.js';
import { ExtendedWMSSeeder } from './16_extended_wms_seeder.js';
import { GeneralLedgerSeeder } from './17_general_ledger_seeder.js';
import { B2BWholesaleSeeder } from './18_b2b_wholesale_seeder.js';
import { MLRecommendationsSeeder } from './19_ml_recommendations_seeder.js';

export function createDefaultSeedRunner(dbAdapter: any, seed: number = 42): SeedRunner {
  const runner = new SeedRunner(dbAdapter, seed);
  runner.register(RolePermissionSeeder);
  runner.register(UserSellerSeeder);
  runner.register(CatalogSeeder);
  runner.register(OrderPaymentSeeder);
  runner.register(EngagementSeeder);
  runner.register(AuditSeeder);
  runner.register(ExtendedAuthSeeder);
  runner.register(ExtendedSellerSeeder);
  runner.register(ExtendedCatalogSeeder);
  runner.register(ExtendedInventorySeeder);
  runner.register(ExtendedOrderSeeder);
  runner.register(ExtendedPaymentSeeder);
  runner.register(ExtendedEngagementSeeder);
  runner.register(ExtendedNotificationSeeder);
  runner.register(ExtendedAuditSeeder);
  runner.register(ExtendedWMSSeeder);
  runner.register(GeneralLedgerSeeder);
  runner.register(B2BWholesaleSeeder);
  runner.register(MLRecommendationsSeeder);
  return runner;
}

export * from './17_general_ledger_seeder.js';

export * from './18_b2b_wholesale_seeder.js';

export * from './19_ml_recommendations_seeder.js';
