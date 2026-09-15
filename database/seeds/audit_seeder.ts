import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const AuditSeeder: Seeder = {
  name: 'AuditSeeder',
  order: 6,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const auditEvents = [
      {
        id: 'aud-001',
        actorId: 'usr-admin-01',
        actorType: 'USER',
        actorEmail: 'admin@shopsphere.io',
        action: 'SELLER_VERIFICATION_APPROVED',
        entityName: 'sellers',
        entityId: 'seller-apple',
        oldVals: JSON.stringify({ verification_status: 'PENDING' }),
        newVals: JSON.stringify({ verification_status: 'VERIFIED' }),
        fields: JSON.stringify(['verification_status']),
        ip: '192.168.1.10',
        severity: 'INFO',
      },
      {
        id: 'aud-002',
        actorId: 'usr-seller-01',
        actorType: 'USER',
        actorEmail: 'store@apple-authorized.com',
        action: 'PRODUCT_PRICE_UPDATED',
        entityName: 'variants',
        entityId: 'var-mbp16-512',
        oldVals: JSON.stringify({ price: 3599.0 }),
        newVals: JSON.stringify({ price: 3499.0 }),
        fields: JSON.stringify(['price']),
        ip: '10.0.4.22',
        severity: 'INFO',
      },
      {
        id: 'aud-003',
        actorId: 'usr-cust-01',
        actorType: 'USER',
        actorEmail: 'alex.morgan@example.com',
        action: 'ORDER_PLACED_AND_PAID',
        entityName: 'orders',
        entityId: 'ord-2026-0001',
        oldVals: null,
        newVals: JSON.stringify({ grand_total: 3779.0, status: 'CONFIRMED' }),
        fields: JSON.stringify(['order_number', 'grand_total', 'payment_status']),
        ip: '172.56.21.90',
        severity: 'INFO',
      },
      {
        id: 'aud-004',
        actorId: null,
        actorType: 'SYSTEM',
        actorEmail: 'system@shopsphere.io',
        action: 'SECURITY_RATE_LIMIT_EXCEEDED',
        entityName: 'security_events',
        entityId: 'sec-event-84920',
        oldVals: null,
        newVals: JSON.stringify({ ip_address: '203.0.113.42', threshold: 100, attempts: 180 }),
        fields: JSON.stringify(['ip_address', 'threat_score']),
        ip: '203.0.113.42',
        severity: 'WARNING',
      },
    ];

    let count = 0;
    for (const aud of auditEvents) {
      await db.execute(
        `INSERT OR IGNORE INTO audit_logs (
          id, actor_id, actor_type, actor_email, action, entity_name, entity_id,
          old_values, new_values, changed_fields, ip_address, status, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS', ?)`,
        [aud.id, aud.actorId, aud.actorType, aud.actorEmail, aud.action, aud.entityName, aud.entityId, aud.oldVals, aud.newVals, aud.fields, aud.ip, aud.severity]
      );
      count++;
    }

    return { count, entityName: 'audit_logs' };
  },
};
