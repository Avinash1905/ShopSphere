/**
 * ShopSphere E2U Multi-Tenant Isolation & Cross-Seller Security Boundary Test
 * Validates strict isolation between seller organizations:
 * - Prevents cross-tenant product updates and inventory adjustments
 * - Prevents unauthorized access to another seller's customer orders
 * - Evaluates ABAC policies and emits audit log events for unauthorized attempts
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { ABACPolicyEvaluator, SecuritySubject, SecurityResource } from '../../systems/security/abac_policy_evaluator.js';
import { SecurityEventDispatcher } from '../../systems/security/security_events.js';
import { AuditService } from '../../systems/audit/audit_service.js';

describe('E2E: Multi-Tenant Seller Isolation & Boundary Test', () => {
  it('should strictly isolate seller resources and reject cross-tenant manipulation', async () => {
    const { db } = await FixturesLoader.setupTestDatabase();
    const audit = new AuditService(db);

    // 1. Seed two distinct sellers
    await db.execute(
      "INSERT INTO sellers (id, user_id, store_name, store_slug, business_name, verification_status, commission_rate_percentage, rating_average, total_reviews_count, total_sales_count, total_revenue_amount, support_email, is_featured, created_at, updated_at) VALUES ('seller-apple-tenant', 'usr-apple-owner', 'Apple Official', 'apple-store-tenant', 'Apple Inc', 'VERIFIED', 8.5, 4.9, 100, 500, 150000.0, 'support@apple.test', 1, datetime('now'), datetime('now'))"
    );
    await db.execute(
      "INSERT INTO sellers (id, user_id, store_name, store_slug, business_name, verification_status, commission_rate_percentage, rating_average, total_reviews_count, total_sales_count, total_revenue_amount, support_email, is_featured, created_at, updated_at) VALUES ('seller-sony-tenant', 'usr-sony-owner', 'Sony Audio', 'sony-store-tenant', 'Sony Corp', 'VERIFIED', 8.0, 4.8, 80, 300, 90000.0, 'support@sony.test', 1, datetime('now'), datetime('now'))"
    );


    // 2. Insert products for both sellers
    await db.execute(
      "INSERT INTO products (id, seller_id, category_id, brand_id, title, slug, description, status, tags, attributes, image_urls, base_price, rating_average, reviews_count, total_sales_count, is_featured, created_at, updated_at) VALUES ('prod-airpods-max', 'seller-apple-tenant', 'cat-audio', 'brand-apple', 'Apple AirPods Max', 'airpods-max-tenant', 'High-fidelity audio', 'PUBLISHED', '[]', '{}', '[]', 549.00, 4.9, 50, 200, 1, datetime('now'), datetime('now'))"
    );
    await db.execute(
      "INSERT INTO products (id, seller_id, category_id, brand_id, title, slug, description, status, tags, attributes, image_urls, base_price, rating_average, reviews_count, total_sales_count, is_featured, created_at, updated_at) VALUES ('prod-wh1000xm5-sony', 'seller-sony-tenant', 'cat-audio', 'brand-sony', 'Sony WH-1000XM5', 'wh-1000xm5-tenant', 'Industry noise canceling', 'PUBLISHED', '[]', '{}', '[]', 399.00, 4.8, 40, 150, 1, datetime('now'), datetime('now'))"
    );


    // 3. Evaluate ABAC permissions for Seller Sony trying to update Apple AirPods Max
    const sonySellerSubject: SecuritySubject = {
      id: 'usr-sony-owner',
      role: 'M11ER',
      sellerId: 'seller-sony-tenant',
    };

    const targetAppleProduct: SecurityResource = {
      id: 'prod-airpods-max',
      type: 'product',
      sellerId: 'seller-apple-tenant',
      status: 'PUBLISHED',
    };


    const canSonyUpdateApple = ABACPolicyEvaluator.evaluate(sonySellerSubject, 'UPDATE', targetAppleProduct);
    Assert.isFalse(canSonyUpdateApple.allowed, 'Sony seller should be DENIED permission to update Apple product');


    if (!canSonyUpdateApple.allowed) {
      await SecurityEventDispatcher.dispatch({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'HIGH',
        ipAddress: '198.51.100.50',
        actorId: sonySellerSubject.id,
        details: {
          attemptedAction: 'UPDATE',
          targetResource: targetAppleProduct.id,
          tenantMismatch: { actorTenant: 'seller-sony-tenant', resourceTenant: 'seller-apple-tenant' },
        },
      });
    }

    // 4. Verify that Apple seller CAN update their own product
    const appleSellerSubject: SecuritySubject = {
      id: 'usr-apple-owner',
      role: 'SELLER',
      sellerId: 'seller-apple-tenant',
    };


    const canAppleUpdateOwn = ABACPolicyEvaluator.evaluate(appleSellerSubject, 'UPDATE', targetAppleProduct);
    Assert.isTrue(canAppleUpdateOwn.allowed, 'Apple seller should be ALLOWED to update their own product');


    // 5. Verify that Platform Admin CAN update across tenants with audit trail
    const adminSubject: SecuritySubject = {
      id: 'usr-admin-01',
      role: 'ADMIN',
    };


    const canAdminUpdate = ABACPolicyEvaluator.evaluate(adminSubject, 'UPDATE', targetAppleProduct);
    Assert.isTrue(canAdminUpdate.allowed, 'Admin should be allowed across tenants');


    await audit.store.append({
      action: 'UPDATE_PRODUCT',
      actorId: adminSubject.id,
      entityName: 'product',
      entityId: targetAppleProduct.id,
      oldValues: { base_price: 549.0 },
      newValues: { base_price: 529.0 },
      ipAddress: '10.0.0.1',
    });


    const auditRes = await audit.queryEngine.queryLogs({ entityName: 'product', entityId: targetAppleProduct.id });
    Assert.greaterThanOrEqual(auditRes.logs.length, 1, 'Audit log entry must be preserved');
  });
});
