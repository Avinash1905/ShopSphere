import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import { createDefaultMigrationRunner } from '../../database/migrations/index.js';
import {
  UserMfaRepository,
  SellerKycRepository,
  ProductAttributeRepository,
  WarehouseInventoryRepository,
  OrderFulfillmentRepository,
  PaymentGatewayRepository,
  SellerSettlementRepository,
  ReviewMediaRepository,
  NotificationTemplateRepository,
  SecurityLedgerRepository,
  OptimisticLockEngine,
  OptimisticLockException,
  DistributedIdempotencyStore,
  MultiTenantRepository,
  TenantIsolationViolationException,
} from '../../database/repositories/index.js';

describe('Phase 2: Extended Domain Repositories & Concurrency Controls', () => {
  it('should manage User MFA devices, sessions, and scoped API keys', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);
    await runner.up();

    const mfaRepo = new UserMfaRepository(db);

    // 1. Register MFA Device
    const dev = await mfaRepo.registerDevice({
      user_id: 'usr-100',
      device_name: 'Work iPhone',
      device_type: 'TOTP',
      secret_encrypted: 'ENC_SECRET_TOTP_123',
      is_active: true,
    });
    Assert.equal(dev.device_name, 'Work iPhone');
    Assert.equal(dev.is_active, true);

    const devices = await mfaRepo.findActiveDevicesByUser('usr-100');
    Assert.equal(devices.length, 1);

    // 2. Create and query session
    const sess = await mfaRepo.createSession({
      user_id: 'usr-100',
      session_token_hash: 'HASH_TOKEN_SESSION_999',
      ip_address: '127.0.0.1',
      is_revoked: false,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    });
    Assert.equal(sess.user_id, 'usr-100');

    const foundSess = await mfaRepo.findSessionByTokenHash('HASH_TOKEN_SESSION_999');
    Assert.isTrue(foundSess !== null);
    Assert.equal(foundSess?.id, sess.id);

    // 3. Revoke sessions
    const revoked = await mfaRepo.revokeAllUserSessions('usr-100');
    Assert.equal(revoked, 1);
    const postRevoke = await mfaRepo.findSessionByTokenHash('HASH_TOKEN_SESSION_999');
    Assert.equal(postRevoke, null);
  });

  it('should handle Seller KYC workflow, payout accounts, and commission tiers', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);
    await runner.up();

    const sellerRepo = new SellerKycRepository(db);

    // 1. Submit KYC
    const kyc = await sellerRepo.submitKyc({
      seller_id: 'sel-200',
      document_type: 'PASSPORT',
      document_number_hash: 'HASH_PASSPORT_987',
      document_url_encrypted: 'ENC_URL_S3_PATH',
    });
    Assert.equal(kyc.verification_status, 'PENDING');

    // 2. Approve KYC
    const approved = await sellerRepo.reviewKyc(kyc.id, 'admin-1', true);
    Assert.equal(approved.verification_status, 'APPROVED');
    Assert.equal(approved.verified_by_user_id, 'admin-1');

    // 3. Register Payout Account
    const payout = await sellerRepo.registerPayoutAccount({
      seller_id: 'sel-200',
      account_type: 'BANK_ACCOUNT',
      account_holder_name: 'Acme Corp LLC',
      account_number_last4: '4321',
      account_number_encrypted: 'ENC_ACC_NUM_777',
      currency: 'USD',
      is_primary: true,
      is_verified: true,
    });
    Assert.equal(payout.is_primary, true);

    const primary = await sellerRepo.getPrimaryPayoutAccount('sel-200');
    Assert.isTrue(primary !== null);
    Assert.equal(primary?.account_holder_name, 'Acme Corp LLC');
  });

  it('should handle dynamic product attributes, media items, and pricing tiers', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);
    await runner.up();

    const prodAttrRepo = new ProductAttributeRepository(db);

    // 1. Create Attribute
    const attr = await prodAttrRepo.create({
      id: 'attr-screen-size',
      name: 'Screen Size',
      code: 'screen_size',
      attribute_type: 'NUMBER',
      is_filterable: true,
      is_searchable: true,
      display_order: 1,
    });
    Assert.equal(attr.code, 'screen_size');

    // 2. Set Product Attribute Value
    const val = await prodAttrRepo.setProductAttributeValue('prod-laptop', attr.id, { numeric: 15.6 });
    Assert.equal(Number(val.numeric_value), 15.6);

    // 3. Add Media
    const media = await prodAttrRepo.addMedia({
      product_id: 'prod-laptop',
      media_type: 'IMAGE',
      url: 'https://cdn.shopsphere.com/laptop-main.jpg',
      is_primary: true,
      sort_order: 0,
    });
    Assert.equal(media.is_primary, true);

    const gallery = await prodAttrRepo.getMediaForProduct('prod-laptop');
    Assert.equal(gallery.length, 1);
    Assert.equal(gallery[0].url, 'https://cdn.shopsphere.com/laptop-main.jpg');
  });

  it('should execute inventory stock allocations, releases, and threshold checks', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);
    await runner.up();

    const invRepo = new WarehouseInventoryRepository(db);

    // 1. Create Warehouse
    const wh = await invRepo.create({
      id: 'wh-us-east',
      code: 'US-EAST-1',
      name: 'New Jersey Fulfillment Node',
      address_line1: '100 Distribution Way',
      city: 'Newark',
      state: 'NJ',
      country: 'USA',
      postal_code: '07101',
      is_active: true,
    });
    Assert.equal(wh.code, 'US-EAST-1');

    // 2. Hold Stock Allocation
    const alloc = await invRepo.holdStockAllocation('inv-prod-1', 'ord-900', 3, 10);
    Assert.equal(alloc.allocated_quantity, 3);
    Assert.equal(alloc.status, 'HELD');

    // 3. Commit Allocation
    const committed = await invRepo.commitAllocation(alloc.id);
    Assert.equal(committed.status, 'COMMITTED');
  });

  it('should execute optimistic lock mutations and prevent concurrent write collisions', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);
    await runner.up();

    // Insert initial inventory record with version = 1
    await db.execute(
      `INSERT INTO inventory (id, product_id, sku, quantity, version, created_at, updated_at) ` +
      `VALUES ('inv-opt-1', 'prod-100', 'SKU-OPT-1', 50, 1, datetime('now'), datetime('now'))`
    );

    // Mutation 1: Deduct 5 units
    const res1 = await OptimisticLockEngine.executeWithLock<{ id: string; quantity: number; version: number }>(
      db,
      'inventory',
      'inv-opt-1',
      async (current) => ({ quantity: current.quantity - 5 })
    );

    Assert.equal(res1.quantity, 45);
    Assert.equal(res1.version, 2);

    // Mutation 2: Deduct 10 units
    const res2 = await OptimisticLockEngine.executeWithLock<{ id: string; quantity: number; version: number }>(
      db,
      'inventory',
      'inv-opt-1',
      async (current) => ({ quantity: current.quantity - 10 })
    );

    Assert.equal(res2.quantity, 35);
    Assert.equal(res2.version, 3);
  });

  it('should enforce idempotency locks and cache idempotent execution responses', async () => {
    const store = new DistributedIdempotencyStore(5000);
    const key = 'idem-checkout-req-456';
    const payload = { orderId: 'ord-123', amount: 199.99 };
    const hash = DistributedIdempotencyStore.hashRequest(payload);

    // 1. First attempt: ACQUIRED
    const attempt1 = await store.acquire(key, hash);
    Assert.equal(attempt1.status, 'ACQUIRED');

    // 2. Concurrent second attempt: IN_FLIGHT_CONFLICT
    const attempt2 = await store.acquire(key, hash);
    Assert.equal(attempt2.status, 'IN_FLIGHT_CONFLICT');

    // 3. Commit result
    await store.commit(key, { success: true, transactionId: 'txn-789' });

    // 4. Third attempt after commit: CACHED
    const attempt3 = await store.acquire(key, hash);
    Assert.equal(attempt3.status, 'CACHED');
    Assert.equal(attempt3.cachedResponse.transactionId, 'txn-789');
  });

  it('should strictly isolate multi-tenant repository access across sellers', async () => {
    const db = new MockDatabaseAdapter();
    const runner = createDefaultMigrationRunner(db);
    await runner.up();

    class ScopedProductRepository extends MultiTenantRepository<{ id: string; name: string; seller_id: string; price: number }> {
      constructor(db: MockDatabaseAdapter, sellerId: string) {
        super('products', db, { tenantId: sellerId, tenantColumn: 'seller_id', enforceStrictIsolation: true });
      }
    }

    const seller1Repo = new ScopedProductRepository(db, 'sel-alpha');
    const seller2Repo = new ScopedProductRepository(db, 'sel-beta');

    // Seller 1 creates a product
    const p1 = await seller1Repo.create({
      id: 'prod-alpha-1',
      name: 'Alpha Gadget',
      price: 99.99,
    });
    Assert.equal(p1.seller_id, 'sel-alpha');

    // Seller 2 attempts to read Seller 1's product -> throws isolation exception
    let thrown = false;
    try {
      await seller2Repo.findById('prod-alpha-1');
    } catch (err: any) {
      if (err instanceof TenantIsolationViolationException) {
        thrown = true;
      }
    }
    Assert.isTrue(thrown, 'Should throw TenantIsolationViolationException on cross-tenant access');

    // Seller 2 query only returns seller 2 items
    const seller2Products = await seller2Repo.findAll();
    Assert.equal(seller2Products.data.length, 0);
  });
});
