import * as crypto from 'crypto';

export interface MigrationStep {
  name: string;
  version: string;
  description: string;
  up(db: MigrationDatabaseAdapter): Promise<void>;
  down(db: MigrationDatabaseAdapter): Promise<void>;
}

export interface MigrationRecord {
  id: string;
  name: string;
  version: string;
  batch: number;
  checksum: string;
  applied_at: string;
  execution_time_ms: number;
}

export interface MigrationDatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ rowsAffected: number }>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}

export class MigrationRunner {
  private migrations: MigrationStep[] = [];
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public register(migration: MigrationStep): void {
    if (this.migrations.some((m) => m.version === migration.version)) {
      throw new Error(`Duplicate migration version registered: ${migration.version} (${migration.name})`);
    }
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
  }

  public async initMigrationTable(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(64) NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL
      );
    `);
  }

  public async getAppliedMigrations(): Promise<MigrationRecord[]> {
    await this.initMigrationTable();
    const rows = await this.db.query<MigrationRecord>(
      'SELECT id, name, version, batch, checksum, applied_at, execution_time_ms FROM _migrations ORDER BY version ASC'
    );
    return rows;
  }

  public async getPendingMigrations(): Promise<MigrationStep[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));
    return this.migrations.filter((m) => !appliedVersions.has(m.version));
  }

  public async up(targetVersion?: string): Promise<{ appliedCount: number; migrations: string[] }> {
    await this.initMigrationTable();
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));
    const currentBatch = applied.reduce((max, m) => Math.max(max, m.batch), 0) + 1;

    const pending = this.migrations.filter((m) => {
      if (appliedVersions.has(m.version)) return false;
      if (targetVersion && m.version.localeCompare(targetVersion, undefined, { numeric: true }) > 0) return false;
      return true;
    });

    const appliedNames: string[] = [];

    for (const migration of pending) {
      console.log(`[Migration] Applying ${migration.version}: ${migration.name}...`);
      const startTime = Date.now();

      await this.db.beginTransaction();
      try {
        await migration.up(this.db);

        const execTime = Date.now() - startTime;
        const checksum = this.calculateChecksum(migration);

        await this.db.execute(
          `INSERT INTO _migrations (id, name, version, batch, checksum, execution_time_ms) VALUES (?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), migration.name, migration.version, currentBatch, checksum, execTime]
        );

        await this.db.commitTransaction();
        appliedNames.push(migration.name);
        console.log(`[Migration] ✓ Applied ${migration.version} in ${execTime}ms`);
      } catch (err) {
        await this.db.rollbackTransaction();
        console.error(`[Migration] ✗ Failed to apply migration ${migration.version}:`, err);
        throw err;
      }
    }

    return {
      appliedCount: appliedNames.length,
      migrations: appliedNames,
    };
  }

  public async rollback(steps: number = 1): Promise<{ rolledBackCount: number; migrations: string[] }> {
    await this.initMigrationTable();
    const applied = await this.getAppliedMigrations();
    if (applied.length === 0) {
      console.log('[Migration] No applied migrations to rollback.');
      return { rolledBackCount: 0, migrations: [] };
    }

    const latestBatch = Math.max(...applied.map((m) => m.batch));
    const batchMigrations = applied
      .filter((m) => m.batch === latestBatch)
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
      .slice(0, steps);

    const rolledBackNames: string[] = [];

    for (const record of batchMigrations) {
      const step = this.migrations.find((m) => m.version === record.version);
      if (!step) {
        throw new Error(`Migration code for applied version ${record.version} (${record.name}) was not found in registry.`);
      }

      console.log(`[Migration] Rolling back ${step.version}: ${step.name}...`);
      await this.db.beginTransaction();
      try {
        await step.down(this.db);
        await this.db.execute('DELETE FROM _migrations WHERE version = ?', [record.version]);
        await this.db.commitTransaction();
        rolledBackNames.push(step.name);
        console.log(`[Migration] ✓ Rolled back ${step.version}`);
      } catch (err) {
        await this.db.rollbackTransaction();
        console.error(`[Migration] ✗ Rollback failed on ${step.version}:`, err);
        throw err;
      }
    }

    return {
      rolledBackCount: rolledBackNames.length,
      migrations: rolledBackNames,
    };
  }

  private calculateChecksum(migration: MigrationStep): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${migration.version}:${migration.name}:${migration.description}`);
    return hash.digest('hex');
  }
}
