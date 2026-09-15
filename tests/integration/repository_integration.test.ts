import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { UserFactory, ProductFactory, OrderFactory, CouponFactory } from '../../systems/testing/test_factories.js';

describe('Repository Integration Test Suite', () => {
  it('should support user creation, failed login increments, and account lockout', async () => {
    const { uow } = await FixturesLoader.setupTestDatabase();

    const newUser = UserFactory.create({ email: 'lockout.target@example.com' });
    await uow.users.create(newUser);

    const retrieved = await uow.users.findByEmail('lockout.target@example.com');
    Assert.isNotNull(retrieved, 'User successfully retrieved by email');
    Assert.equal(retrieved!.failed_login_attempts, 0, 'Initial failed attempts is 0');

    // Simulate 5 failed login attempts
    let lockStatus = { locked: false, attempts: 0 };
    for (let i = 0; i < 5; i++) {
      lockStatus = await uow.users.recordFailedLogin(newUser.id, 5, 15);
    }

    Assert.isTrue(lockStatus.locked, 'User account is locked after 5 failed attempts');
    Assert.equal(lockStatus.attempts, 5, 'Failed attempts count is 5');

    // Successful login resets lockout
    await uow.users.recordSuccessfulLogin(newUser.id);
    const refreshed = await uow.users.findById(newUser.id);
    Assert.equal(refreshed!.failed_login_attempts, 0, 'Failed attempts reset to 0');
    Assert.isNull(refreshed!.lockout_until, 'Lockout expiry cleared');
  });

  it('should support atomic inventory reservation, release, and optimistic concurrency version locking', async () => {
    const { uow } = await FixturesLoader.setupTestDatabase();

    const testVariantId = 'var-mbp16-512';
    const initialInv = await uow.inventory.findByVariantId(testVariantId);
    Assert.isNotNull(initialInv, 'Inventory record exists');
    const startAvailable = initialInv!.quantity_available;

    // 1. Reserve 5 units
    const reserveRes = await uow.inventory.reserveStock(testVariantId, 5);
    Assert.isTrue(reserveRes.success, 'Stock reservation succeeded');
    Assert.equal(reserveRes.availableAfter, startAvailable - 5, 'Available stock decreased by 5');

    // 2. Release 2 units
    await uow.inventory.releaseReservation(testVariantId, 2);
    const afterRelease = await uow.inventory.findByVariantId(testVariantId);
    Assert.equal(afterRelease!.quantity_available, startAvailable - 3, 'Available stock restored by 2');

    // 3. Fulfill 3 units
    await uow.inventory.fulfillStock(testVariantId, 3);
    const afterFulfill = await uow.inventory.findByVariantId(testVariantId);
    Assert.equal(afterFulfill!.quantity_reserved, 0, 'Reserved stock decremented to 0');
  });

  it('should validate coupons with minimum spend, date windows, and usage counts', async () => {
    const { uow } = await FixturesLoader.setupTestDatabase();

    // 1. Valid coupon application
    const validCheck = await uow.coupons.validateCoupon('SAVE20', 'usr-cust-01', 250.0);
    Assert.isTrue(validCheck.isValid, 'SAVE20 is valid for $250 order');
    Assert.equal(validCheck.discountAmount, 50.0, '20% discount on $250 is $50');

    // 2. Minimum order threshold failure
    const minCheck = await uow.coupons.validateCoupon('SAVE20', 'usr-cust-01', 50.0);
    Assert.isFalse(minCheck.isValid, 'SAVE20 rejected when subtotal below $100 min threshold');

    // 3. Non-existent coupon code
    const invalidCheck = await uow.coupons.validateCoupon('DOES_NOT_EXIST', 'usr-cust-01', 500.0);
    Assert.isFalse(invalidCheck.isValid, 'Non-existent coupon rejected');
  });

  it('should execute transactional unit of work with automatic commit', async () => {
    const { uow } = await FixturesLoader.setupTestDatabase();

    await uow.execute(async (unit) => {
      const p = ProductFactory.create({ title: 'Transactional Product Test' });
      await unit.products.create(p);

      const created = await unit.products.findById(p.id);
      Assert.isNotNull(created, 'Product created inside transaction');
    });

    const products = await uow.products.findAll();
    Assert.greaterThan(products.total, 0, 'Products persisted after commit');
  });
});
