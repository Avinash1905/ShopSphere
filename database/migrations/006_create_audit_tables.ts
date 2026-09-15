import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration006CreateAuditTables: MigrationStep = {
  name: '006_create_audit_tables',
  version: '20260915000006',
  description: 'Create immutable audit_logs table for state tracking, security events, and compliance',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        actor_id VARCHAR(36),
        actor_type VARCHAR(32) NOT NULL DEFAULT 'USER',
        actor_email VARCHAR(255),
        action VARCHAR(120) NOT NULL,
        entity_name VARCHAR(64) NOT NULL,
        entity_id VARCHAR(128) NOT NULL,
        old_values TEXT,
        new_values TEXT,
        changed_fields TEXT DEFAULT '[]',
        ip_address VARCHAR(45),
        user_agent VARCHAR(512),
        session_id VARCHAR(128),
        request_id VARCHAR(128),
        status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
        severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS audit_logs;');
  },
};
