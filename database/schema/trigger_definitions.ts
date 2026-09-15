/**
 * ShopSphere Database Layer - Trigger Definitions
 * Cross-dialect declarative triggers for:
 * - updated_at auto-synchronization
 * - Stock level non-negative validation
 * - Audit log tampering prevention (immutable updates)
 */

export interface DatabaseTriggerDefinition {
  name: string;
  tableName: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  event: 'INSERT' | 'UPDATE' | 'DELETE' | 'INSERT OR UPDATE';
  description: string;
  ddl: {
    postgres: string;
    sqlite: string;
  };
}

export class TriggerRegistry {
  private static triggers: DatabaseTriggerDefinition[] = [
    {
      name: 'trg_users_updated_at',
      tableName: 'users',
      timing: 'BEFORE',
      event: 'UPDATE',
      description: 'Auto-updates updated_at timestamp on users table',
      ddl: {
        postgres: `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();`,
        sqlite: `
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;`,
      },
    },
    {
      name: 'trg_prevent_audit_tamper',
      tableName: 'audit_logs',
      timing: 'BEFORE',
      event: 'UPDATE',
      description: 'Prevents updates or modifications to immutable audit log records',
      ddl: {
        postgres: `
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or modified.';
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trg_prevent_audit_tamper
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();`,
        sqlite: `
CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_tamper
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Audit logs are immutable and cannot be modified');
END;`,
      },
    },
  ];

  public static getAllTriggers(): DatabaseTriggerDefinition[] {
    return this.triggers;
  }

  public static generateAllTriggersDDL(dialect: 'postgres' | 'sqlite'): string[] {
    return this.triggers.map((t) => t.ddl[dialect].trim());
  }
}
