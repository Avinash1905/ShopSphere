import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedNotificationSeeder: Seeder = {
  name: 'ExtendedNotificationSeeder',
  order: 14,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let inserted = 0;

    await db.execute(`
      INSERT INTO notification_templates (id, template_code, channel, locale, subject_template, body_template, is_active, created_at, updated_at)
      VALUES ('tpl-order-placed', 'ORDER_PLACED_CONFIRMATION', 'EMAIL', 'en_US', 'Your ShopSphere Order #{{orderId}} is Confirmed!', 'Hi {{name}}, thank you for ordering from ShopSphere.', 1, datetime('now'), datetime('now'));
    `);
    inserted++;

    await db.execute(`
      INSERT INTO notification_templates (id, template_code, channel, locale, subject_template, body_template, is_active, created_at, updated_at)
      VALUES ('tpl-order-shipped', 'ORDER_SHIPPED_DISPATCH', 'SMS', 'en_US', NULL, 'ShopSphere: Order #{{orderId}} has shipped via {{carrier}}! Track: {{trackingUrl}}', 1, datetime('now'), datetime('now'));
    `);
    inserted++;

    await db.execute(`
      INSERT INTO notification_templates (id, template_code, channel, locale, subject_template, body_template, is_active, created_at, updated_at)
      VALUES ('tpl-security-alert', 'SECURITY_LOGIN_NEW_DEVICE', 'EMAIL', 'en_US', 'Security Alert: New Sign-in to Your Account', 'We detected a new login from IP {{ipAddress}}.', 1, datetime('now'), datetime('now'));
    `);
    inserted++;

    return { count: inserted, entityName: 'extended_notifications' };
  },
};
