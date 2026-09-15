import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration019CreateExtendedAuditTables: MigrationStep = {
  name: '019_create_extended_audit_tables',
  version: '20260915000019',
  description: 'Create security events ledger, data access logs, GDPR erasure requests, and compliance manifests',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS security_events_ledger (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        severity VARCHAR(16) NOT NULL DEFAULT 'INFO',
        actor_user_id VARCHAR(64),
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        resource_accessed VARCHAR(255),
        action_status VARCHAR(32) NOT NULL,
        event_data JSON,
        tamper_hash VARCHAR(128) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS data_access_logs (
        id VARCHAR(64) PRIMARY KEY,
        accessor_user_id VARCHAR(64) NOT NULL,
        target_table VARCHAR(64) NOT NULL,
        target_record_id VARCHAR(64) NOT NULL,
        pii_fields_accessed JSON NOT NULL,
        access_purpose VARCHAR(128) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (accessor_user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS gdpr_erasure_requests (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        requester_email VARCHAR(255) NOT NULL,
        verification_token VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        anonymized_at TIMESTAMP,
        proof_hash VARCHAR(128),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS compliance_manifests (
        id VARCHAR(64) PRIMARY KEY,
        framework VARCHAR(64) NOT NULL,
        control_id VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PASSED',
        evidence_url TEXT,
        tested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        tested_by VARCHAR(64) NOT NULL,
        metadata JSON
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS compliance_manifests;');
    await db.execute('DROP TABLE IF EXISTS gdpr_erasure_requests;');
    await db.execute('DROP TABLE IF EXISTS data_access_logs;');
    await db.execute('DROP TABLE IF EXISTS security_events_ledger;');
  },
};
