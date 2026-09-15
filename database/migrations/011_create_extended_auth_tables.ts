import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration011CreateExtendedAuthTables: MigrationStep = {
  name: '011_create_extended_auth_tables',
  version: '20260915000011',
  description: 'Create user MFA devices, OAuth logins, password history, sessions, and API keys',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_mfa_devices (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        device_name VARCHAR(128) NOT NULL,
        device_type VARCHAR(32) NOT NULL,
        secret_encrypted TEXT NOT NULL,
        backup_codes_encrypted TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_oauth_providers (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        provider_name VARCHAR(64) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        access_token_encrypted TEXT,
        refresh_token_encrypted TEXT,
        token_expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_password_histories (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        session_token_hash VARCHAR(128) NOT NULL UNIQUE,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        device_fingerprint VARCHAR(128),
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        key_name VARCHAR(128) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        key_hash VARCHAR(128) NOT NULL UNIQUE,
        scopes JSON NOT NULL,
        rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS user_api_keys;');
    await db.execute('DROP TABLE IF EXISTS user_sessions;');
    await db.execute('DROP TABLE IF EXISTS user_password_histories;');
    await db.execute('DROP TABLE IF EXISTS user_oauth_providers;');
    await db.execute('DROP TABLE IF EXISTS user_mfa_devices;');
  },
};
