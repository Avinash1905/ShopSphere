import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedAuditSeeder: Seeder = {
  name: 'ExtendedAuditSeeder',
  order: 15,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const users = await db.query<{ id: string }>('SELECT id FROM users LIMIT 3');
    let inserted = 0;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];

      // 1. Seed Security Event Ledger Record
      await db.execute(`
        INSERT INTO security_events_ledger (id, event_type, severity, actor_user_id, ip_address, action_status, tamper_hash, created_at)
        VALUES (
          'secevt-seed-${i + 1}',
          'USER_MFA_ENROLLED',
          'INFO',
          '${u.id}',
          '10.0.0.${10 + i}',
          'SUCCESS',
          'TAMPER_PROOF_HASH_CHAIN_${i + 1}',
          datetime('now')
        );
      `);
      inserted++;

      // 2. Seed Data Access Log
      await db.execute(`
        INSERT INTO data_access_logs (id, accessor_user_id, target_table, target_record_id, pii_fields_accessed, access_purpose, ip_address, created_at)
        VALUES (
          'dacc-seed-${i + 1}',
          '${u.id}',
          'users',
          '${u.id}',
          '["email", "phone_number"]',
          'CUSTOMER_PROFILE_VIEW',
          '10.0.0.${10 + i}',
          datetime('now')
        );
      `);
      inserted++;
    }

    // 3. Seed Compliance Manifests
    await db.execute(`INSERT INTO compliance_manifests (id, framework, control_id, status, tested_at, tested_by) VALUES ('comp-soc2-cc6.1', 'SOC2_TYPE_II', 'CC6.1_LOGICAL_ACCESS', 'PASSED', datetime('now'), 'sec-auditor-bot');`);
    inserted++;

    await db.execute(`INSERT INTO compliance_manifests (id, framework, control_id, status, tested_at, tested_by) VALUES ('comp-pci-3.4', 'PCI_DSS_v4.0', 'REQ_3.4_PAN_ENCRYPTION', 'PASSED', datetime('now'), 'sec-auditor-bot');`);
    inserted++;

    await db.execute(`INSERT INTO compliance_manifests (id, framework, control_id, status, tested_at, tested_by) VALUES ('comp-gdpr-art17', 'GDPR_EU', 'ARTICLE_17_RIGHT_TO_ERASURE', 'PASSED', datetime('now'), 'sec-auditor-bot');`);
    inserted++;

    return { count: inserted, entityName: 'extended_audit' };
  },
};
