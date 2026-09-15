import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { SellerAnalyticsService } from '../../systems/analytics/seller_analytics.js';
import { OrderFactory } from '../../systems/testing/test_factories.js';

describe('E2E: Seller Analytics Pipeline Test', () => {
  it('should reflect multiple placed orders in seller revenue metrics, top products, and conversion funnel', async () => {
    const { db, uow } = await FixturesLoader.setupTestDatabase();
    const sellerAnalytics = new SellerAnalyticsService(db);

    const sellerId = 'seller-sony';

    // 1. Initial dashboard read
    const initialDashboard = await sellerAnalytics.getSellerDashboard(sellerId);
    Assert.isNotNull(initialDashboard, 'Initial seller dashboard retrieved');
    const prevRevenue = initialDashboard!.totalRevenue;

    // 2. Generate new completed orders for Sony
    for (let i = 0; i < 3; i++) {
      const order = OrderFactory.create({
        seller_id: sellerId,
        order_status: 'DELIVERED',
        payment_status: 'PAID',
        grand_total: 400.0,
      });
      await uow.orders.create(order);

      await uow.orderItems.create({
        id: `oi-e2e-${i}-${Date.now()}`,
        order_id: order.id,
        product_id: 'prod-sony-wh1000xm5',
        variant_id: 'var-wh1000-blk',
        seller_id: sellerId,
        product_title: 'Sony WH-1000XM5',
        sku: 'SNY-WH1000XM5-BLK',
        quantity: 1,
        unit_price: 399.99,
        discount_amount: 0.0,
        tax_amount: 32.0,
        total_price: 400.0,
        item_status: 'DELIVERED',
      });
    }

    // 3. Re-evaluate dashboard metrics
    const updatedDashboard = await sellerAnalytics.getSellerDashboard(sellerId);
    Assert.greaterThan(updatedDashboard!.totalRevenue, prevRevenue, 'Seller revenue updated with new sales');
    Assert.greaterThan(updatedDashboard!.totalOrders, initialDashboard!.totalOrders, 'Seller order count increased');
    Assert.greaterThan(updatedDashboard!.conversionFunnel.purchases, 0, 'Conversion funnel shows recorded purchases');
  });
});
