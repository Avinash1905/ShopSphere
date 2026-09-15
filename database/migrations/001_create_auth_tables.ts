import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration001CreateAuthTables: MigrationStep = {
  name: '001_create_auth_tables',
  version: '20260915000001',
  description: 'Create users, roles, permissions, role_permissions, and user_roles tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone_number VARCHAR(32) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(64) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION',
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
        two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        two_factor_secret VARCHAR(128),
        avatar_url VARCHAR(512),
        date_of_birth DATE,
        gender VARCHAR(32),
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        lockout_until TIMESTAMP,
        last_login_at TIMESTAMP,
        last_password_change_at TIMESTAMP,
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(64) NOT NULL UNIQUE,
        description TEXT,
        is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
        priority INTEGER NOT NULL DEFAULT 100,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(36) PRIMARY KEY,
        module VARCHAR(64) NOT NULL,
        action VARCHAR(64) NOT NULL,
        code VARCHAR(128) NOT NULL UNIQUE,
        description TEXT,
        is_system_permission BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id VARCHAR(36) NOT NULL,
        permission_id VARCHAR(36) NOT NULL,
        granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        granted_by VARCHAR(36),
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id VARCHAR(36) NOT NULL,
        role_id VARCHAR(36) NOT NULL,
        assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        assigned_by VARCHAR(36),
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS user_roles;');
    await db.execute('DROP TABLE IF EXISTS role_permissions;');
    await db.execute('DROP TABLE IF EXISTS permissions;');
    await db.execute('DROP TABLE IF EXISTS roles;');
    await db.execute('DROP TABLE IF EXISTS users;');
  },
};
