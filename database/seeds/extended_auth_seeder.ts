import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedAuthSeeder: Seeder = {
  name: 'ExtendedAuthSeeder',
  order: 7,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const users = await db.query<{ id: string }>('SELECT id FROM users LIMIT 10');
    let inserted = 0;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];

      // 1. Seed MFA Device
      await db.execute(`
        INSERT INTO user_mfa_devices (id, user_id, device_name, device_type, secret_encrypted, is_active, created_at, updated_at)
        VALUES (
          'mfa-seed-${i + 1}',
          '${u.id}',
          'Seed Authenticator ${i + 1}',
          'TOTP',
          'ENC_TOTP_SECRET_KEY_${i + 1}',
          1,
          datetime('now'),
          datetime('now')
        );
      `);
      inserted++;

      // 2. Seed User Session
      await db.execute(`
        INSERT INTO user_sessions (id, user_id, session_token_hash, ip_address, is_revoked, expires_at, created_at, last_accessed_at)
        VALUES (
          'sess-seed-${i + 1}',
          '${u.id}',
          'SESSION_HASH_SEED_${i + 1}',
          '192.168.1.${10 + i}',
          0,
          datetime('now', '+7 days'),
          datetime('now'),
          datetime('now')
        );
      `);
      inserted++;

      // 3. Seed API Key
      await db.execute(`
        INSERT INTO user_api_keys (id, user_id, key_name, key_prefix, key_hash, scopes, is_active, created_at)
        VALUES (
          'apikey-seed-${i + 1}',
          '${u.id}',
          'Production Integration Key ${i + 1}',
          'sk_live',
          'API_KEY_HASH_SEED_${i + 1}',
          '["orders:read", "inventory:write", "products:read"]',
          1,
          datetime('now')
        );
      `);
      inserted++;
    }

    return { count: inserted, entityName: 'extended_auth' };
  },
};
