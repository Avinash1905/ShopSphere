import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const EngagementSeeder: Seeder = {
  name: 'EngagementSeeder',
  order: 5,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let count = 0;

    // 1. Reviews
    const reviews = [
      {
        id: 'rev-001',
        prodId: 'prod-macbook-pro-16',
        userId: 'usr-cust-01',
        rating: 5,
        title: 'Unbelievable performance and battery life',
        comment: 'Compile times dropped by 70%. Best laptop I have ever owned for software development.',
        verified: true,
        helpful: 42,
        reply: 'Thank you for your feedback! Glad to power your development workflows.',
      },
      {
        id: 'rev-002',
        prodId: 'prod-sony-wh1000xm5',
        userId: 'usr-cust-02',
        rating: 5,
        title: 'Best ANC on flights',
        comment: 'Completely eliminates jet engine noise. Comfortable to wear for 10-hour flights.',
        verified: true,
        helpful: 19,
        reply: 'Safe travels and enjoy the serene audio quality!',
      },
      {
        id: 'rev-003',
        prodId: 'prod-nike-alphafly-3',
        userId: 'usr-cust-03',
        rating: 5,
        title: 'PR broken by 4 minutes',
        comment: 'Energy return on race day is extraordinary. Worth every penny for serious runners.',
        verified: true,
        helpful: 28,
        reply: 'Huge congratulations on your new personal record! Just Do It.',
      },
    ];

    for (const r of reviews) {
      await db.execute(
        `INSERT OR IGNORE INTO reviews (
          id, product_id, user_id, rating, title, comment, is_verified_purchase,
          status, helpful_votes_count, seller_reply, seller_replied_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?, CURRENT_TIMESTAMP)`,
        [r.id, r.prodId, r.userId, r.rating, r.title, r.comment, r.verified, r.helpful, r.reply]
      );
      count++;
    }

    // 2. Wishlists & Cart items
    const wishlistId = 'wsh-cust-01';
    await db.execute(
      `INSERT OR IGNORE INTO wishlists (id, user_id, name, is_public) VALUES (?, 'usr-cust-01', 'Tech Gear 2026', TRUE)`,
      [wishlistId]
    );
    count++;

    await db.execute(
      `INSERT OR IGNORE INTO wishlist_items (id, wishlist_id, product_id, variant_id, priority)
       VALUES ('wshi-001', ?, 'prod-samsung-s24-ultra', 'var-s24u-gry', 1)`,
      [wishlistId]
    );
    count++;

    // 3. Notifications
    const notifications = [
      { id: 'notif-001', userId: 'usr-cust-01', title: 'Order Delivered', msg: 'Your MacBook Pro order ORD-2026-0001 has arrived.', type: 'ORDER_UPDATE', priority: 'NORMAL' },
      { id: 'notif-002', userId: 'usr-cust-02', title: 'Shipment On The Way', msg: 'Your Sony WH-1000XM5 has been shipped via FedEx.', type: 'ORDER_UPDATE', priority: 'NORMAL' },
      { id: 'notif-003', userId: 'usr-cust-03', title: 'Flash Sale: 20% Off', msg: 'Exclusive weekend deal: use code SAVE20 at checkout.', type: 'PROMOTION', priority: 'LOW' },
    ];

    for (const n of notifications) {
      await db.execute(
        `INSERT OR IGNORE INTO notifications (id, user_id, title, message, notification_type, priority, is_read)
         VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
        [n.id, n.userId, n.title, n.msg, n.type, n.priority]
      );
      count++;
    }

    return { count, entityName: 'engagement_and_notifications' };
  },
};
