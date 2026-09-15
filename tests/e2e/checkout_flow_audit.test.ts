import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { AuditAction } from '../../systems/audit/audit_types.js';

describe('E2E: Checkout Lifecycle & Audit Trail Test', () => {
  it('should execute complete checkout flow: cart -> coupon -> order -> inventory deduction -> payment -> audit ledger', async () => {
    const { db, uow } = await FixturesLoader.setupTestDatabase();

    const customerId = 'usr-cust-01';
    const variantId = 'var-mbp16-512';
    const productPrice = 3499.0;
    const quantity = 1;

    // Step 1: Customer adds item to Cart
    let cart = await uow.carts.getActiveCartByUserId(customerId);
    if (!cart) {
      cart = await uow.carts.create({ id: `cart-${customerId}`, user_id: customerId, currency: 'USD', status: 'ACTIVE' });
    }
    const cartItem = await uow.cartItems.addItem(cart.id, variantId, quantity, productPrice);
    Assert.equal(cartItem.quantity, 1, 'Cart item quantity is 1');
    Assert.equal(cartItem.total_price, 3499.0, 'Cart item total is $3499.0');

    // Step 2: Validate and apply discount coupon SAVE20
    const couponValidation = await uow.coupons.validateCoupon('SAVE20', customerId, productPrice);
    Assert.isTrue(couponValidation.isValid, 'Coupon SAVE20 is valid');
    const discount = couponValidation.discountAmount!;
    Assert.equal(discount, 200.0, 'Max discount capped at $200');

    // Step 3: Atomic stock reservation
    const reserveRes = await uow.inventory.reserveStock(variantId, quantity);
    Assert.isTrue(reserveRes.success, 'Inventory reserved for checkout');

    // Step 4: Create Order with grand total
    const tax = Math.round((productPrice - discount) * 0.08 * 100) / 100;
    const grandTotal = Math.round((productPrice - discount + tax) * 100) / 100;
    const orderId = `ord-e2e-${Date.now()}`;
    const orderNumber = `ORD-E2E-${Date.now()}`;

    const order = await uow.orders.create({
      id: orderId,
      order_number: orderNumber,
      user_id: customerId,
      seller_id: 'seller-apple',
      order_status: 'CONFIRMED',
      payment_status: 'PAID',
      shipping_status: 'UNFULFILLED',
      currency: 'USD',
      subtotal_amount: productPrice,
      discount_amount: discount,
      tax_amount: tax,
      shipping_fee: 0.0,
      grand_total: grandTotal,
      shipping_address_id: 'addr-cust-01',
      billing_address_id: 'addr-cust-01',
    });

    Assert.equal(order.grand_total, grandTotal, 'Order grand total calculated accurately');

    // Step 5: Process Payment
    const payment = await uow.payments.create({
      id: `pay-${orderId}`,
      order_id: orderId,
      user_id: customerId,
      payment_reference: `PAY-REF-${orderNumber}`,
      payment_method: 'CREDIT_CARD',
      payment_gateway: 'STRIPE',
      amount: grandTotal,
      currency: 'USD',
      status: 'CAPTURED',
    });
    Assert.equal(payment.status, 'CAPTURED', 'Payment status is CAPTURED');

    // Step 6: Record Coupon Redemption
    await uow.couponUsages.recordUsage(couponValidation.coupon!.id, customerId, orderId, discount);
    await uow.coupons.incrementUsage(couponValidation.coupon!.id);

    // Step 7: Fulfill Inventory
    await uow.inventory.fulfillStock(variantId, quantity);

    // Step 8: Record Immutable Audit Log
    const auditRecord = await uow.auditLogs.recordEvent({
      id: `aud-ord-${orderId}`,
      actor_id: customerId,
      actor_type: 'USER',
      action: AuditAction.ORDER_CREATED,
      entity_name: 'orders',
      entity_id: orderId,
      new_values: { order_number: orderNumber, grand_total: grandTotal, payment_id: payment.id },
      status: 'SUCCESS',
      severity: 'INFO',
    });

    Assert.isNotNull(auditRecord, 'Audit record persisted');

    // Step 9: Verify complete audit history for order
    const orderAuditHistory = await uow.auditLogs.getEntityHistory('orders', orderId);
    Assert.greaterThan(orderAuditHistory.length, 0, 'Order has verified audit history');
  });
});
