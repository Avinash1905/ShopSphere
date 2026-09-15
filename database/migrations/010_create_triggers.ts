/**
 * Migration 010: Create Database Integrity Triggers
 */

import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';
import { TriggerRegistry } from '../schema/trigger_definitions.js';

export const Migration010CreateTriggers: MigrationStep = {
  name: '010_create_triggers',
  version: '20260915000010',
  description: 'Create triggers for updated_at timestamps and audit log immutability',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    for (const sql of TriggerRegistry.generateAllTriggersDDL('sqlite')) {
      await db.execute(sql);
    }
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TRIGGER IF EXISTS trg_users_updated_at;');
    await db.execute('DROP TRIGGER IF EXISTS trg_prevent_audit_tamper;');
  },
};
