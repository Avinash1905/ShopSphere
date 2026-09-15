/**
 * Migration 008: Create Table Partitions for High-Volume Ledger Tables
 */

import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';
import { PartitionManager } from '../schema/partition_manager.js';

export const Migration008CreatePartitionedTables: MigrationStep = {
  name: '008_create_partitioned_tables',
  version: '20260915000008',
  description: 'Create quarterly range partitions for audit_logs and notifications tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    const auditConfig = PartitionManager.getPartitionConfig('audit_logs');
    if (auditConfig) {
      for (const sql of PartitionManager.generatePostgresPartitionDDL(auditConfig)) {
        await db.execute(sql);
      }
    }
    const notifConfig = PartitionManager.getPartitionConfig('notifications');
    if (notifConfig) {
      for (const sql of PartitionManager.generatePostgresPartitionDDL(notifConfig)) {
        await db.execute(sql);
      }
    }
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS audit_logs_2026_q1;');
    await db.execute('DROP TABLE IF EXISTS audit_logs_2026_q2;');
    await db.execute('DROP TABLE IF EXISTS audit_logs_2026_q3;');
    await db.execute('DROP TABLE IF EXISTS audit_logs_2026_q4;');
    await db.execute('DROP TABLE IF EXISTS notifications_2026_h1;');
    await db.execute('DROP TABLE IF EXISTS notifications_2026_h2;');
  },
};
