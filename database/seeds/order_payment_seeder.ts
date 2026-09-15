import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const OrderPaymentSeeder: Seeder = {
  name: 'OrderPaymentSeeder',
  order: 4,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let count = 0;

    // 1. Coupons
    const coupons = [
      { id: 'cpn-save20', code: 'SAVE20', title: '20% Off Storewide', type: 'PERCENTAGE', val: 20.0, min: 100.0, max: 200.0 },
      { id: 'cpn-welcome10', code: 'WELCOME10', title: '$10 Off First Order', type: 'FIXED_AMOUNT', val: 10.0, min: 50.0, max: 10.0 },
      { id: 'cpn-freeship', code: 'FREESHIP', title: 'Free Standard Shipping', type: 'FREE_SHIPPING', val: 15.0, min: 75.0, max: 15.0 },
    ];

    for (const c of coupons) {
      await db.execute(
        `INSERT OR IGNORE INTO coupons (
          id, code, title, discount_type, discount_value, min_order_amount, max_discount_amount,
          start_date, end_date, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'), datetime('now', '+30 days'), TRUE)`,
        [c.id, c.code, c.title, c.type, c.val, c.min, c.max]
      );
      count++;
    }

    // 2. Default addresses for customers
    const addresses = [
      { id: 'addr-cust-01', user_id: 'usr-cust-01', name: 'Alex Morgan', line1: '742 Evergreen Terrace', city: 'Springfield', state: 'OR', zip: '97477' },
      { id: 'addr-cust-02', user_id: 'usr-cust-02', name: 'Emma Watson', line1: '221B Baker Street', city: 'London', state: 'NW', zip: 'NW16XE' },
      { id: 'addr-cust-03', user_id: 'usr-cust-03', name: 'David Miller', line1: '456 Elm Avenue', city: 'Austin', state: 'TX', zip: '78701' },
      { id: 'addr-cust-04', user_id: 'usr-cust-04', name: 'Sophia Taylor', line1: '892 Pine St', city: 'Seattle', state: 'WA', zip: '98101' },
      { id: 'addr-cust-05', user_id: 'usr-cust-05', name: 'Lucas Chen', line1: '100 Market St', city: 'San Francisco', state: 'CA', zip: '94105' },
    ];

    for (const a of addresses) {
      await db.execute(
        `INSERT OR IGNORE INTO addresses (
          id, user_id, address_type, recipient_name, address_line1, city, state_province,
          postal_code, country_code, phone_number, is_default_shipping, is_default_billing
        ) VALUES (?, ?, 'SHIPPING', ?, ?, ?, ?, ?, 'US', '+1-555-0199', TRUE, TRUE)`,
        [a.id, a.user_id, a.name, a.line1, a.city, a.state, a.zip]
      );
      count++;
    }

    // 3. Orders & Line Items
    const sampleOrders = [
      {
        orderId: 'ord-2026-0001',
        orderNumber: 'ORD-2026-0001',
        userId: 'usr-cust-01',
        sellerId: 'seller-apple',
        status: 'DELIVERED',
        payStatus: 'PAID',
        subtotal: 3499.0,
        discount: 0.0,
        tax: 280.0,
        shipping: 0.0,
        total: 3779.0,
        addrId: 'addr-cust-01',
        payMethod: 'CREDIT_CARD',
        items: [
          { id: 'item-0001-1', prodId: 'prod-macbook-pro-16', varId: 'var-mbp16-512', title: 'Apple MacBook Pro 16" M3 Max', sku: 'AAPL-MBP16-512GB-SLV', qty: 1, price: 3499.0 },
        ],
      },
      {
        orderId: 'ord-2026-0002',
        orderNumber: 'ORD-2026-0002',
        userId: 'usr-cust-02',
        sellerId: 'seller-sony',
        status: 'SHIPPED',
        payStatus: 'PAID',
        subtotal: 399.99,
        discount: 10.0,
        tax: 32.0,
        shipping: 15.0,
        total: 436.99,
        addrId: 'addr-cust-02',
        payMethod: 'STRIPE',
        items: [
          { id: 'item-0002-1', prodId: 'prod-sony-wh1000xm5', varId: 'var-wh1000-blk', title: 'Sony WH-1000XM5 Wireless Headphones', sku: 'SNY-WH1000XM5-BLK', qty: 1, price: 399.99 },
        ],
      },
      {
        orderId: 'ord-2026-0003',
        orderNumber: 'ORD-2026-0003',
        userId: 'usr-cust-03',
        sellerId: 'seller-nike',
        status: 'CONFIRMED',
        payStatus: 'PAID',
        subtotal: 570.0,
        discount: 50.0,
        tax: 45.6,
        shipping: 0.0,
        total: 565.6,
        addrId: 'addr-cust-03',
        payMethod: 'PAYPAL',
        items: [
          { id: 'item-0003-1', prodId: 'prod-nike-alphafly-3', varId: 'var-alphafly-10', title: 'Nike Air Zoom Alphafly 3 Road Marathon Shoes', sku: 'NKE-ALPH3-US10-WHT', qty: 2, price: 285.0 },
        ],
      },
    ];

    for (const ord of sampleOrders) {
      await db.execute(
        `INSERT OR IGNORE INTO orders (
          id, order_number, user_id, seller_id, order_status, payment_status, shipping_status,
          currency, subtotal_amount, discount_amount, tax_amount, shipping_fee, grand_total,
          shipping_address_id, billing_address_id, tracking_number
        ) VALUES (?, ?, ?, ?, ?, ?, 'FULFILLED', 'USD', ?, ?, ?, ?, ?, ?, ?, 'TRK-98402814')`,
        [
          ord.orderId,
          ord.orderNumber,
          ord.userId,
          ord.sellerId,
          ord.status,
          ord.payStatus,
          ord.subtotal,
          ord.discount,
          ord.tax,
          ord.shipping,
          ord.total,
          ord.addrId,
          ord.addrId,
        ]
      );
      count++;

      for (const itm of ord.items) {
        await db.execute(
          `INSERT OR IGNORE INTO order_items (
            id, order_id, product_id, variant_id, seller_id, product_title, sku, quantity,
            unit_price, total_price, item_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
          [itm.id, ord.orderId, itm.prodId, itm.varId, ord.sellerId, itm.title, itm.sku, itm.qty, itm.price, itm.qty * itm.price]
        );
        count++;
      }

      const payId = `pay-${ord.orderId}`;
      await db.execute(
        `INSERT OR IGNORE INTO payments (
          id, order_id, user_id, payment_reference, payment_method, payment_gateway,
          amount, currency, status, processed_at
        ) VALUES (?, ?, ?, ?, ?, 'STRIPE_GATEWAY', ?, 'USD', 'CAPTURED', CURRENT_TIMESTAMP)`,
        [payId, ord.orderId, ord.userId, `REF-${ord.orderNumber}`, ord.payMethod, ord.total]
      );
      count++;
    }

    return { count, entityName: 'orders_and_payments' };
  },
};
